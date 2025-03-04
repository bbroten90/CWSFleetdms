import sqlite3
from datetime import datetime

# Connect to the database
conn = sqlite3.connect('dispatch.db')  # Using dispatch.db as seen in your logs
cursor = conn.cursor()

# Execute the SQL command with the correct table name: activity_logs (not activity_log)
cursor.execute("""
INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, created_at)
VALUES (1, 'SYNC_COMPLETE', 'SYSTEM', 0, 'Manually reset sync status', ?)
""", (datetime.utcnow(),))

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Sync status reset successfully!")