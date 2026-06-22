import json
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def seed_db():
    # 1. Connect to postgres default DB to create vitacard_db
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        user="satish",
        database="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()

    # Create database if not exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'vitacard_db';")
    exists = cursor.fetchone()
    if not exists:
        print("Creating database vitacard_db...")
        cursor.execute("CREATE DATABASE vitacard_db;")
    else:
        print("Database vitacard_db already exists.")

    cursor.close()
    conn.close()

    # 2. Connect to vitacard_db
    conn = psycopg2.connect(
        host="localhost",
        port=5433,
        user="satish",
        database="vitacard_db"
    )
    cursor = conn.cursor()

    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS doctors (
            s_no INT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            specialization VARCHAR(255),
            clinic VARCHAR(255),
            address TEXT,
            city VARCHAR(255),
            phone VARCHAR(255),
            source VARCHAR(255)
        );
    """)
    conn.commit()

    # Clear existing records
    cursor.execute("TRUNCATE TABLE doctors;")
    conn.commit()

    # Load data from doctors.json
    json_path = "/home/satish/Desktop/medical-bot/src/db/doctors.json"
    with open(json_path, "r", encoding="utf-8") as f:
        doctors = json.load(f)

    # Insert doctors
    print(f"Inserting {len(doctors)} doctor records into local postgres database...")
    for doc in doctors:
        cursor.execute("""
            INSERT INTO doctors (s_no, name, specialization, clinic, address, city, phone, source)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            doc["s_no"],
            doc["name"],
            doc["specialization"],
            doc["clinic"],
            doc["address"],
            doc["city"],
            doc["phone"],
            doc["source"]
        ))
    
    conn.commit()
    print("Database seeding completed successfully!")

    # Verify count
    cursor.execute("SELECT COUNT(*) FROM doctors;")
    count = cursor.fetchone()[0]
    print(f"Verified count in table 'doctors': {count}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    seed_db()
