import sqlite3
import os

# Define the path
db_path = os.path.join("data", "bank_data.db")

# 1. Create the data directory if it doesn't exist
if not os.path.exists("data"):
    os.makedirs("data")
    print("Created 'data' directory.")

# 2. Remove the old/corrupted file to start fresh
if os.path.exists(db_path):
    os.remove(db_path)
    print("Removed old database file.")

# 3. Connect and create the schema
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("Creating table 'unified_transactions'...")
cursor.execute("""
CREATE TABLE unified_transactions (
    subject_id TEXT,
    event_type TEXT,
    val REAL,
    is_violation INTEGER,
    source TEXT
)
""")

# 4. Insert some mock data so the AI has something to find
sample_data = [
    ('USR_9324', 'TRANSFER', 85000.0, 1, 'IBM_AML'),
    ('USR_4670', 'CASH_OUT', 120.50, 0, 'PaySim'),
    ('USR_1102', 'PAYMENT', 99000.0, 1, 'IBM_AML'),
    ('USR_0071', 'DEPOSIT', 4500.0, 0, 'HR_System')
    
]

cursor.executemany("INSERT INTO unified_transactions VALUES (?, ?, ?, ?, ?)", sample_data)
conn.commit()
conn.close()

print(f"✅ SUCCESS: Database initialized at {db_path}")