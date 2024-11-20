import psycopg2
import re
import gzip
import requests
import argparse
from datetime import datetime
import os

def download_file(url, file_path):
    if os.path.exists(file_path):
        print(f"The file {file_path} already exists. Skipping download.")
    else:
        print(f"Downloading the file from {url}...")
        response = requests.get(url, stream=True)
        with open(file_path, 'wb') as file:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)
        print("Download completed.")

def process_dump(dump_file_path, lang, conn, cur):
    insert_pattern = re.compile(
        r"\((\d+),(\d+),'([^']+)',(\d+),\d+,\d+\.\d+,'[^']+','[^']+',\d+,(\d+),'wikitext',NULL\)"
    )

    with gzip.open(dump_file_path, 'rt', encoding='utf-8') as f:
        for line in f:
            if line.startswith('INSERT INTO `page`'):
                matches = insert_pattern.findall(line)
                for match in matches:
                    page_id = int(match[0])
                    namespace = int(match[1])
                    page_title = match[2]
                    is_redirect = int(match[3])
                    page_length = int(match[4])

                    # Skip if it's a list article or disambiguation page
                    if namespace == 0 and is_redirect == 0:  # Only main namespace articles that are not redirects
                        if "רשימ" in page_title or "פירושונים" in page_title:
                            continue

                        # Insert the article into the database
                        cur.execute(
                            "INSERT INTO articles (page_id, title, length, language) VALUES (%s, %s, %s, %s) ON CONFLICT (page_id, language) DO NOTHING",
                            (page_id, page_title, page_length, lang)
                        )

    conn.commit()

def main():
    parser = argparse.ArgumentParser(description="Process Wikipedia dump files.")
    parser.add_argument("lang", help="Language shortcut (e.g., 'en' for English, 'fr' for French)")
    parser.add_argument("date", help="Date of the dump file (YYYYMMDD format)")
    parser.add_argument("db_password", help="Database password")
    args = parser.parse_args()

    # Validate date format
    try:
        datetime.strptime(args.date, '%Y%m%d')
    except ValueError:
        print("Incorrect date format. Please use YYYYMMDD.")
        return

    # Construct URL and file path
    url = f'https://mirror.accum.se/mirror/wikimedia.org/dumps/{args.lang}wiki/{args.date}/{args.lang}wiki-{args.date}-page.sql.gz'
    dump_file_path = f'{args.lang}wiki-{args.date}-page.sql.gz'

    # Download the file
    download_file(url, dump_file_path)

    # PostgreSQL connection details
    conn = psycopg2.connect(f"dbname=test_db user=postgres password={args.db_password}")
    cur = conn.cursor()

    # Create the articles table if it doesn't exist, including the language column
    cur.execute("""
        CREATE TABLE IF NOT EXISTS articles (
            page_id INTEGER,
            title TEXT,
            length INTEGER,
            language VARCHAR(2),
            PRIMARY KEY (page_id, language)
        );
    """)
    conn.commit()

    # Process the dump file
    print("Processing the dump file...")
    process_dump(dump_file_path, args.lang, conn, cur)

    # Close the database connection
    cur.close()
    conn.close()

    print("Data processing completed.")

if __name__ == "__main__":
    main()
