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

def find_io_by_id(_list, _id, id_attr):
    results = []
    for item in _list:
        if item[id_attr] == _id:
            results.append(item)
    return results


def get_actions():
    raw_actions = sql_all("SELECT * FROM action")
    raw_inputs = sql_all("SELECT * FROM action_input")
    raw_outputs = sql_all("SELECT * FROM action_output")
    raw_sources_map = sql_all("SELECT * FROM action_source")
    raw_sources = sql_all("SELECT * FROM source")
    log("raw_inputs " + str(raw_inputs))
    log("raw_outputs " + str(raw_outputs))
    result = []
    for a in raw_actions:
        relevant_inputs =  find_io_by_id(raw_inputs, a["id"],"action_id")
        relevant_outputs =  find_io_by_id(raw_outputs, a["id"],"action_id")
        relevant_sources_map =  find_io_by_id(raw_sources_map, a["id"],"action_id")
        relevant_sources = []
        for s in relevant_sources_map:
            sources_found = find_io_by_id(raw_sources, s["source_id"],"id")
            if len(sources_found)==1:
                relevant_sources.append(sources_found[0])
            else:
                log("sources_found expected 1 instead got other: " + str(len(sources_found)) + "   "+ str(sources_found))

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
