import datetime
import subprocess
from typing import Dict, List
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

@app.route('/item')
def item_all():
    return jsonify( sql_all("SELECT * FROM item"))
@app.route('/action')
def action_all():
    log("action_all...")
    return jsonify( get_actions())

def find_by_id(_list,  _id):
    results = []
    for item in _list:
        if item["action_id"] == _id:
            results.append(item)
    return results


def get_actions():
    raw_actions = sql_all("SELECT * FROM action")
    raw_inputs = sql_all("SELECT * FROM action_input")
    raw_outputs = sql_all("SELECT * FROM action_output")
    raw_sources = sql_all("SELECT * FROM soure")
    log("raw_inputs " + str(raw_inputs))
    log("raw_outputs " + str(raw_outputs))
    result = []
    for a in raw_actions:
        relevant_inputs =  find_by_id(raw_inputs, a["id"])
        relevant_outputs =  find_by_id(raw_outputs, a["id"])
        relevant_sources =  find_by_id(raw_sources, a["id"])
        a["inputs"] = relevant_inputs
        a["outputs"] = relevant_outputs
        a["sources"] = relevant_sources
        result.append(a)
    log("result " + str(result))
    return  result


def get_connection():
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
        columns = [desc[0] for desc in cursor.description]
        data = cursor.fetchall()
        return [dict(zip(columns, row)) for row in data]


def sql_all(query):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        data = cursor.fetchall()
        return [dict(zip(columns, row)) for row in data]

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
    log("drivers: " )
    for d in pyodbc.drivers():
        log("d: " +d )
    log("drivers-end " )
    log("select action: " + str( get_actions()))

serverstart()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
