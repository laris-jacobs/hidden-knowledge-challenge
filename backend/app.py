import datetime
import subprocess

from flask import Flask, jsonify

app = Flask(__name__)


def log(msg):
    print(f"[server] [{datetime.datetime.now().replace(microsecond=0).isoformat()}] {msg}")


@app.route('/')
def index():
    log("index...")
    data = {"somearray": ["aaa", "bbb"]}
    return jsonify(data)



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


serverstart()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)
