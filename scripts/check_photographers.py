import json
import pathlib
import psycopg2

root = pathlib.Path(__file__).resolve().parents[1]
cfg = json.loads((root / "ShootMatch.Api" / "appsettings.json").read_text(encoding="utf-8"))
cs = cfg["ConnectionStrings"]["DefaultConnection"]
parts = dict(s.split("=", 1) for s in cs.split(";") if "=" in s)

conn = psycopg2.connect(
    host=parts["Host"],
    dbname=parts["Database"],
    user=parts["Username"],
    password=parts["Password"],
    sslmode="require",
)
cur = conn.cursor()

cur.execute('SELECT "Id", "DisplayName", "Email" FROM photographers')
rows = cur.fetchall()
print("Photographers:")
for row in rows:
    # Print safe ascii representations
    pid, name, email = row
    name_ascii = name.encode('ascii', errors='ignore').decode('ascii')
    print(f"ID: {pid}, Name: {name_ascii}, Email: {email}")

conn.close()
