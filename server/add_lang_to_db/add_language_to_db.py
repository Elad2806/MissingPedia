import subprocess
import argparse
from datetime import datetime, timedelta

# Set up argument parsing
parser = argparse.ArgumentParser(description="Run all scripts with provided arguments.")
parser.add_argument("language", help="Language of the dump files (e.g., 'el').")
parser.add_argument("dump_date", help="Date of the dump files (e.g., '20240720').")
parser.add_argument("password", help="Password for the database.")

args = parser.parse_args()

# Calculate start and end dates for the pageviews script
dump_date = datetime.strptime(args.dump_date, "%Y%m%d")
# Determine the first day of the previous month
first_day_current_month = dump_date.replace(day=1)
start_date = (first_day_current_month - timedelta(days=1)).replace(day=1)
end_date = start_date + timedelta(days=30)  # 30 days after the start

# Define the scripts and their arguments
scripts = [
    ["lang_links.py", args.language, args.dump_date, args.password],
    ["page_cat_link.py", args.language, args.dump_date, args.password],
    ["articles.py", args.language, args.dump_date, args.password],
    ["categories.py", args.language, args.dump_date, args.password],
    ["cat_links.py", args.language, args.dump_date, "--password", args.password],
    ["populate_page_views_general.py", args.language, start_date.strftime("%Y-%m-%d"), end_date.strftime("%Y-%m-%d"), args.password],
]

# Loop through each script and execute it
# Run this script using this form: python run_all.py <lang> <yyyymmdd> <db_password>
for script in scripts:
    try:
        print(f"Running: {' '.join(['python'] + script)}")
        subprocess.run(["python"] + script, check=True)
        print(f"Finished: {script[0]}")
    except subprocess.CalledProcessError as e:
        print(f"Error occurred while running {script[0]}: {e}")