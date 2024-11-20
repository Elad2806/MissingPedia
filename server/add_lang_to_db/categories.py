import psycopg2
import re
import gzip
import requests
import argparse
from datetime import datetime


def download_file(url, file_path):
    print(f"Downloading the file from {url}...")
    response = requests.get(url, stream=True)
    with open(file_path, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                file.write(chunk)
    print("Download completed.")


def parse_insert_values(values_str):
    values = []
    current_value = []
    in_quotes = False
    for char in values_str:
        if char == "'" and (not current_value or current_value[-1] != '\\'):
            in_quotes = not in_quotes
        elif char == ',' and not in_quotes:
            values.append(''.join(current_value).strip("'"))
            current_value = []
        else:
            current_value.append(char)
    if current_value:
        values.append(''.join(current_value).strip("'"))
    return values


def process_dump(dump_file_path, lang, cur):
    insert_stmt_re = re.compile(r"INSERT INTO `page` VALUES (.*);")

    with gzip.open(dump_file_path, 'rt', encoding='utf-8', errors='replace') as file:
        for line in file:
            match = insert_stmt_re.search(line)
            if match:
                values_str = match.group(1)
                tuples = re.split(r'\),\s*\(', values_str.strip('()'))

                for tuple_str in tuples:
                    parsed_values = parse_insert_values(tuple_str)
                    if len(parsed_values) >= 3 and parsed_values[1] == '14':  # Check if it's a category (namespace 14)
                        page_id, page_title = parsed_values[0], parsed_values[2]
                        print(f"Inserting category: {page_id}, {page_title}, language: '{lang}'")
                        cur.execute("""
                            INSERT INTO categories (category_id, category_title, language)
                            VALUES (%s, %s, %s)
                            ON CONFLICT (category_id) DO NOTHING
                        """, (page_id, page_title, lang))
        cur.connection.commit()


def main():
    parser = argparse.ArgumentParser(description="Process Wikipedia dump and extract categories to PostgreSQL.")
    parser.add_argument("lang", help="Language shortcut (e.g., 'en' for English, 'fr' for French)")
    parser.add_argument("date", help="Date of the dump file (YYYYMMDD format)")
    parser.add_argument("password", help="PostgreSQL password")
    args = parser.parse_args()

    # Validate date format
    try:
        dump_date = datetime.strptime(args.date, "%Y%m%d")
    except ValueError:
        print("Error: Invalid date format. Please use YYYYMMDD.")
        return

    # Construct URL and file path
    url = f'https://mirror.accum.se/mirror/wikimedia.org/dumps/{args.lang}wiki/{args.date}/{args.lang}wiki-{args.date}-page.sql.gz'
    dump_file_path = f'{args.lang}wiki-{args.date}-page.sql.gz'

    # Download the file
    download_file(url, dump_file_path)

    # PostgreSQL connection details
    conn = psycopg2.connect(f"dbname=test_db user=postgres password={args.password}")
    cur = conn.cursor()

    # Create table if it doesn't exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS categories (
        category_id INTEGER PRIMARY KEY,
        category_title TEXT,
        language VARCHAR(2)
    );
    """)
    conn.commit()

    # Process the dump file
    process_dump(dump_file_path, args.lang, cur)

    # Close the database connection
    cur.close()
    conn.close()

    print("Data processing completed.")


if __name__ == "__main__":
    main()
