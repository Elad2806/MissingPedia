import psycopg2
import re
import gzip
import requests
import argparse
import os

def download_file(url, file_path):
    print(f"Downloading the file from {url}...")
    response = requests.get(url, stream=True)
    with open(file_path, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
    print("Download completed.")

def process_dump(dump_file_path, from_lang, cur, conn):
    insert_re = re.compile(r"\((\d+),'(\w+)','([^']*)'\)")

    with gzip.open(dump_file_path, "rt", encoding="utf-8", errors="replace") as file:
        line_number = 0
        for line in file:
            line_number += 1

            if line_number % 10000 == 0:
                print(f"Processing line {line_number}")

            try:
                matches = insert_re.findall(line)
                for match in matches:
                    ll_from = int(match[0])
                    ll_lang = match[1]
                    ll_title = match[2]

                    cur.execute("""
                        INSERT INTO lang_links (ll_from_lang, ll_from, ll_lang, ll_title) 
                        VALUES (%s, %s, %s, %s);
                    """, (from_lang, ll_from, ll_lang, ll_title))
                conn.commit()
            except Exception as e:
                print(f"Error processing line {line_number}: {line}")
                print(f"Exception: {e}")
                continue

def main():
    parser = argparse.ArgumentParser(description="Process Wikipedia langlinks dump and load into PostgreSQL")
    parser.add_argument("language", help="Language shortcut (e.g., 'en' for English)")
    parser.add_argument("date", help="Dump file date (YYYYMMDD)")
    parser.add_argument("db_password", help="Database password")
    args = parser.parse_args()

    # Construct the URL and file path
    url = f'https://mirror.accum.se/mirror/wikimedia.org/dumps/{args.language}wiki/{args.date}/{args.language}wiki-{args.date}-langlinks.sql.gz'
    dump_file_path = f'{args.language}wiki-{args.date}-langlinks.sql.gz'

    # Download the file if it doesn't exist
    if not os.path.exists(dump_file_path):
        download_file(url, dump_file_path)
    else:
        print(f"File {dump_file_path} already exists. Skipping download.")

    # PostgreSQL connection details
    conn = psycopg2.connect(f"dbname=test_db user=postgres password={args.db_password}")
    cur = conn.cursor()

    # Create or modify the lang_links table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS lang_links (
            ll_from_lang VARCHAR(10) NOT NULL,
            ll_from INTEGER NOT NULL,
            ll_lang VARCHAR(10) NOT NULL,
            ll_title TEXT NOT NULL
        );
    """)
    conn.commit()

    # Process the dump file
    process_dump(dump_file_path, args.language, cur, conn)

    # Close the database connection
    cur.close()
    conn.close()

    print("Data processing completed.")

if __name__ == "__main__":
    main()