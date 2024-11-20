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

def process_dump(lang, date, db_params):
    # Construct URL and file path
    url = f'https://mirror.accum.se/mirror/wikimedia.org/dumps/{lang}wiki/{date}/{lang}wiki-{date}-categorylinks.sql.gz'
    dump_file_path = f'{lang}wiki-{date}-categorylinks.sql.gz'

    # Download the file
    download_file(url, dump_file_path)

    # PostgreSQL connection
    conn = psycopg2.connect(**db_params)
    cur = conn.cursor()

    # Create table if it doesn't exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS category_links (
        subcategory INTEGER,
        parent_category TEXT,
        language VARCHAR(2)
    );
    """)
    conn.commit()

    # Regex to match INSERT statements
    insert_stmt_re = re.compile(r"INSERT INTO `categorylinks` VALUES (.*);")

    with gzip.open(dump_file_path, 'rt', encoding='utf-8', errors='replace') as file:
        for line in file:
            match = insert_stmt_re.search(line)
            if match:
                values_str = match.group(1)
                tuples = re.split(r'\),\s*\(', values_str.strip('()'))

                for tuple_str in tuples:
                    parsed_values = parse_insert_values(tuple_str)
                    if len(parsed_values) == 7 and parsed_values[6] == 'subcat':
                        cl_from, cl_to = parsed_values[0], parsed_values[1]
                        cur.execute("""
                            INSERT INTO category_links (subcategory, parent_category, language)
                            VALUES (%s, %s, %s)
                        """, (cl_from, cl_to, lang))
        conn.commit()

    # Close the database connection
    cur.close()
    conn.close()

    print("Data processing completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process Wikipedia dump files.")
    parser.add_argument("lang", help="Language shortcut (e.g., 'en' for English)")
    parser.add_argument("date", help="Date of the dump file (YYYYMMDD)")
    parser.add_argument("--dbname", default="test_db", help="Database name")
    parser.add_argument("--user", default="postgres", help="Database user")
    parser.add_argument("--password", required=True, help="Database password")
    parser.add_argument("--host", default="localhost", help="Database host")
    parser.add_argument("--port", default="5432", help="Database port")

    args = parser.parse_args()

    # Validate date format
    try:
        datetime.strptime(args.date, "%Y%m%d")
    except ValueError:
        raise ValueError("Incorrect date format, should be YYYYMMDD")

    db_params = {
        "dbname": args.dbname,
        "user": args.user,
        "password": args.password,
        "host": args.host,
        "port": args.port
    }

    process_dump(args.lang, args.date, db_params)