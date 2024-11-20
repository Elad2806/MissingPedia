import os
import requests
import gzip
import psycopg2
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import time
import argparse
from datetime import datetime, timedelta

# Database connection
conn = None
cur = None

# Dictionary to hold the total views for each language and article
pageviews = defaultdict(lambda: defaultdict(int))
pageviews_lock = threading.Lock()


def connect_to_database(db_password):
    global conn, cur
    conn = psycopg2.connect(f"dbname=test_db user=postgres password={db_password}")
    cur = conn.cursor()


def download_pageviews_file(url, local_path, max_retries=5):
    retries = 0
    while retries < max_retries:
        try:
            response = requests.get(url, stream=True, timeout=10)
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                return True
            else:
                print(f"Failed to download {url}, status code: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"Exception during download: {e}")

        retries += 1
        wait_time = 2 ** retries
        print(f"Retrying download {url} in {wait_time} seconds...")
        time.sleep(wait_time)

    print(f"Failed to download {url} after {max_retries} retries")
    return False


def process_lines(lines, languages):
    local_pageviews = {lang: defaultdict(int) for lang in languages}
    for line in lines:
        parts = line.split()
        if len(parts) != 4:
            continue
        project, article, views, _ = parts
        if project in languages:
            local_pageviews[project][article] += int(views)
    return local_pageviews


def process_pageviews_dump(dump_file, languages):
    with gzip.open(dump_file, 'rt', encoding='utf-8') as f:
        lines = f.readlines()
        return process_lines(lines, languages)


def update_shared_pageviews(local_pageviews):
    with pageviews_lock:
        for lang, lang_views in local_pageviews.items():
            for article, views in lang_views.items():
                pageviews[lang][article] += views


def update_database():
    print("Updating database...")
    with pageviews_lock:
        for lang, lang_views in pageviews.items():
            x = 0
            for article, views in lang_views.items():
                if x % 10000 == 0:
                    print(f"{lang}: {x}")
                x += 1
                try:
                    cur.execute(
                        "UPDATE articles SET view_count = %s WHERE title = %s AND language = %s",
                        (views, article, lang)
                    )
                except Exception as e:
                    print(f"Error updating {article} for {lang}: {e}")
        conn.commit()


def process_file(file_url, local_path, languages):
    if download_pageviews_file(file_url, local_path):
        local_pageviews = process_pageviews_dump(local_path, languages)
        update_shared_pageviews(local_pageviews)

        start_time = time.time()
        while True:
            try:
                os.remove(local_path)
                break
            except PermissionError:
                if time.time() - start_time > 10:
                    print(f"Warning: Could not delete the file {local_path} after 10 seconds.")
                    break
                time.sleep(1)


def process_batch(start_date, end_date, languages):
    base_url = "https://dumps.wikimedia.org/other/pageviews/"
    current_date = start_date

    while current_date <= end_date:
        year = current_date.year
        month = current_date.month
        day = current_date.day

        local_dir = f"{year}-{month:02d}"
        os.makedirs(local_dir, exist_ok=True)

        tasks = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            for hour in range(24):
                file_name = f"pageviews-{year}{month:02d}{day:02d}-{hour:02d}0000.gz"
                file_url = f"{base_url}{year}/{year}-{month:02d}/{file_name}"
                local_path = os.path.join(local_dir, file_name)
                tasks.append(executor.submit(process_file, file_url, local_path, languages))

            for future in as_completed(tasks):
                future.result()  # Ensure exceptions are raised

        current_date += timedelta(days=1)

    update_database()


def main():
    parser = argparse.ArgumentParser(
        description="Process Wikipedia pageviews for multiple languages and a specific date range.")
    parser.add_argument("languages", nargs='+',
                        help="Wikipedia language codes (e.g., 'en' for English, 'he' for Hebrew)")
    parser.add_argument("start_date", help="Start date in YYYY-MM-DD format")
    parser.add_argument("end_date", help="End date in YYYY-MM-DD format")
    parser.add_argument("db_password", help="Database password")

    args = parser.parse_args()

    start_date = datetime.strptime(args.start_date, "%Y-%m-%d")
    end_date = datetime.strptime(args.end_date, "%Y-%m-%d")

    connect_to_database(args.db_password)

    process_batch(start_date, end_date, args.languages)

    if conn:
        conn.close()


if __name__ == "__main__":
    main()