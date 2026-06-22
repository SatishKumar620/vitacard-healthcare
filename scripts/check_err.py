import sqlite3
import json

try:
    conn = sqlite3.connect('/home/node/.n8n/database.sqlite')
    cur = conn.cursor()
    cur.execute('SELECT nodes FROM workflow_entity LIMIT 1')
    row = cur.fetchone()
    if row:
        nodes = json.loads(row[0])
        print("=== Node Credentials in DB ===")
        for n in nodes:
            if n.get('credentials'):
                print(f"Node '{n.get('name')}':", n.get('credentials'))
    else:
        print("No workflow found.")
except Exception as e:
    print("Python Error:", str(e))
