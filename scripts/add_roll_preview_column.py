"""Add RollPreviewPhotos to customers if missing."""
import json
import pathlib
import sys

try:
    import psycopg2
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary", "-q"])
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
conn.autocommit = True
cur = conn.cursor()

cur.execute(
    'ALTER TABLE customers ADD COLUMN IF NOT EXISTS "RollPreviewPhotos" character varying(4096) NOT NULL DEFAULT \'\''
)
print("RollPreviewPhotos:", "ok")

migration_id = "20260520000000_AddCustomerRollPreviewPhotos"
cur.execute(
    'INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES (%s, %s) ON CONFLICT DO NOTHING',
    (migration_id, "9.0.10"),
)
print("migration history:", cur.rowcount)

cur.execute(
    """SELECT column_name FROM information_schema.columns
       WHERE table_name = 'customers' AND column_name = 'RollPreviewPhotos'"""
)
print("columns:", [r[0] for r in cur.fetchall()])

conn.close()
