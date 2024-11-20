import psycopg2
import re
import gzip
import requests
import tempfile
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

def write_batch_to_tempfile(batch, temp_file):
    temp_file.writelines(batch)

def process_dump(dump_file_path, language, batch_size=10000):
    insert_stmt_re = re.compile(r"INSERT INTO `categorylinks` VALUES (.*);")
    batch = []

    with gzip.open(dump_file_path, 'rt', encoding='utf-8', errors='replace') as file:
        with tempfile.NamedTemporaryFile(mode='w+', encoding='utf-8', delete=False) as temp_file:
            for line in file:
                match = insert_stmt_re.search(line)
                if match:
                    values_str = match.group(1)
                    tuples = re.split(r'\),\s*\(', values_str.strip('()'))

                    for tuple_str in tuples:
                        parsed_values = parse_insert_values(tuple_str)
                        if len(parsed_values) == 7 and parsed_values[6] == 'page':
                            cl_from, cl_to = parsed_values[0], parsed_values[1]
                            cl_to_cleaned = cl_to.replace('\\', '')
                            batch.append(f"{cl_from}\t{cl_to_cleaned}\t{language}\n")

                            if len(batch) >= batch_size:
                                write_batch_to_tempfile(batch, temp_file)
                                batch = []

            if batch:
                write_batch_to_tempfile(batch, temp_file)

    return temp_file.name

def load_data_to_db(conn, cur, temp_file_name, batch_size=10000):
    with open(temp_file_name, 'r', encoding='utf-8') as temp_file:
        while True:
            lines = temp_file.readlines(batch_size)
            if not lines:
                break
            with tempfile.NamedTemporaryFile(mode='w+', encoding='utf-8', delete=False) as chunk_file:
                chunk_file.writelines(lines)
                chunk_file_name = chunk_file.name

            with open(chunk_file_name, 'r', encoding='utf-8') as chunk_file:
                cur.copy_from(chunk_file, 'page_cat_link', columns=('page_id', 'category', 'language'), sep='\t')
            conn.commit()
            print(f"Committed {batch_size} records to the database")

def main():
    parser = argparse.ArgumentParser(description="Process Wikipedia dump and load into PostgreSQL")
    parser.add_argument("language", help="Language shortcut (e.g., 'en' for English)")
    parser.add_argument("date", help="Dump file date (YYYYMMDD)")
    parser.add_argument("db_password", help="Database password")
    args = parser.parse_args()

    # Construct the URL and file path
    url = f'https://mirror.accum.se/mirror/wikimedia.org/dumps/{args.language}wiki/{args.date}/{args.language}wiki-{args.date}-categorylinks.sql.gz'
    dump_file_path = f'{args.language}wiki-{args.date}-categorylinks.sql.gz'

    # Download the file
    download_file(url, dump_file_path)

    # PostgreSQL connection details
    conn = psycopg2.connect(f"dbname=test_db user=postgres password={args.db_password}")
    cur = conn.cursor()

    # Create the page_cat_link table with the 'language' column if it doesn't exist
    cur.execute("""
    CREATE TABLE IF NOT EXISTS page_cat_link (
        page_id INTEGER,
        category TEXT,
        language TEXT
    );
    """)
    conn.commit()

    # Process the dump file
    temp_file_name = process_dump(dump_file_path, args.language)

    # Load data from the temporary file into the database
    load_data_to_db(conn, cur, temp_file_name)

    # Close the database connection
    cur.close()
    conn.close()

    print("Data processing completed.")

if __name__ == "__main__":
    main()