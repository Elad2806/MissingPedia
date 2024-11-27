import os
import psycopg2

def get_db_connection():
    # Retrieve the connection details from environment variables
    host = os.getenv('DB_HOST')
    user = os.getenv('DB_USER')
    password = os.getenv('DB_PASSWORD')
    dbname = os.getenv('DB_NAME')

    # Connect to the database
    try:
        connection = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            dbname=dbname
        )
        print("Database connection successful")
        return connection
    except Exception as e:
        print("Error connecting to the database:", e)
        return None