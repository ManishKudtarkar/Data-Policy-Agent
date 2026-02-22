import sqlite3
import os
import pandas as pd

def execute_query(sql: str):
    # Use Absolute Path to prevent "file is not a database" errors
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    db_path = os.path.join(BASE_DIR, "data", "bank_data.db")
    
    conn = sqlite3.connect(db_path)
    try:
        df = pd.read_sql_query(sql, conn)
        return df
    except Exception as e:
        print(f"⚠️ SQL Error: {e}")
        return pd.DataFrame()
    finally:
        conn.close()