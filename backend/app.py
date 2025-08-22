import datetime
import subprocess
from dotenv import load_dotenv
from flask import Flask, jsonify
import pyodbc
app = Flask(__name__)


def log(msg):
    print(f"[server] [{datetime.datetime.now().replace(microsecond=0).isoformat()}] {msg}")


@app.route('/')
def index():
    log("index...")
    data = {"somearray": ["aaa", "bbb"]}
    return jsonify(data)


def get_connection():
    log("drivers: " )
    for d in pyodbc.drivers():
        log("d: " +d )
    log("drivers-end " )
    odbc_string = """Driver={ODBC Driver 18 for SQL Server};Server=tcp:bernhaeckt-sql.database.windows.net,1433;Database=Bernhaeckt;Uid=bernhaeckt;Pwd=Unisysch2025;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;"""

    try:
        connection = pyodbc.connect(odbc_string)
        return connection
    except pyodbc.Error as e:
        app.logger.error(f"Database connection error: {e}")
        raise

def sql_one(query):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        return cursor.fetchone()

def runshell(cmd):
    output = ""
    log(f"run: {cmd}")
    procresult = subprocess.run(
        cmd,
        shell=True,
        text=True,
        capture_output=True,
    )
    output += f"<br>stdout: {procresult.stdout}\n"
    output += f"<br>stderr: {procresult.stderr}\n"
    return output



def serverstart():
    log("serverstart...")
    log("testrunshell: " + runshell("ls -la"))
    log("select 1 result: " + str( sql_one("select 1")))
    log("select schemas result: " + str(sql_one("select schema_name from information_schema.schemata")))


serverstart()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
