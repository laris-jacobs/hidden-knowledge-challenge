# app.py
"""
Lightweight Flask API for reading items/actions from an MSSQL database.

Key improvements:
- No hard-coded secrets: pick up MSSQL connection details from environment variables
- Centralized, typed SQL helpers (dict rows, params)
- Efficient in-memory grouping for assembling actions with inputs/outputs/sources
- Proper logging instead of print, no shell execution on import
- CORS configurable via environment
"""

from __future__ import annotations

import os
import logging
from collections import defaultdict
from typing import Any, Dict, Iterable, List, Optional, Tuple

import pyodbc
from flask import Flask, jsonify
from flask_cors import CORS


# -----------------------------------------------------------------------------
# App & logging setup
# -----------------------------------------------------------------------------

def create_app() -> Flask:
    app = Flask(__name__)

    # Configure logging (INFO by default, override via LOG_LEVEL)
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="[server] [%(asctime)s] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    app.logger.info("Starting Flask app")

    # CORS: allow all by default; set CORS_ORIGINS="https://example.com,https://foo.bar" in prod
    origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, resources={r"/*": {"origins": [o.strip() for o in origins.split(",")]}})

    # -------------------------------------------------------------------------
    # Routes
    # -------------------------------------------------------------------------

    @app.route("/")
    def index():
        app.logger.info("GET /")
        return jsonify({"status": "ok", "message": "API alive", "links": ["/health", "/item", "/action"]})

    @app.route("/health")
    def health():
        """Basic health endpoint with DB connectivity check."""
        try:
            _ = sql_all("SELECT 1 AS ok")
            return jsonify({"status": "ok"}), 200
        except Exception as exc:  # pragma: no cover
            app.logger.exception("Health check failed")
            return jsonify({"status": "error", "detail": str(exc)}), 500

    @app.route("/item")
    def item_all():
        """Return all items as an array of dicts."""
        rows = sql_all("SELECT * FROM dbo.item")
        return jsonify(rows)

    @app.route("/action")
    def action_all():
        """Return actions with nested inputs/outputs/sources (denormalized shape expected by UI)."""
        app.logger.info("GET /action ...")
        data = get_actions()
        return jsonify(data)

    return app


# -----------------------------------------------------------------------------
# Configuration & DB connection
# -----------------------------------------------------------------------------

def _build_connection_string() -> str:
    """
    Build a secure ODBC connection string from environment variables.

    Required:
      - MSSQL_PASSWORD
    Optional (with defaults):
      - MSSQL_SERVER (default: 'localhost')
      - MSSQL_PORT (default: '1433')
      - MSSQL_DB (default: 'mcdb')
      - MSSQL_USER (default: 'sa')
      - ODBC_DRIVER (default: 'ODBC Driver 18 for SQL Server')
      - MSSQL_ENCRYPT ('yes'|'no', default: 'yes')
      - MSSQL_TRUST_CERT ('yes'|'no', default: 'yes' — set 'no' for proper TLS)
    """
    driver = os.getenv("ODBC_DRIVER", "ODBC Driver 18 for SQL Server")
    server = os.getenv("MSSQL_SERVER", "bernhaeckt-sql.database.windows.net")
    port = os.getenv("MSSQL_PORT", "1433")
    db = os.getenv("MSSQL_DB", "Bernhaeckt")
    user = os.getenv("MSSQL_USER", "bernhaeckt")
    password = os.getenv("MSSQL_PASSWORD","Unisysch2025")  # <- REQUIRED
    encrypt = os.getenv("MSSQL_ENCRYPT", "yes")
    trust = os.getenv("MSSQL_TRUST_CERT", "yes")

    if not password:
        raise RuntimeError("MSSQL_PASSWORD is not set")

    return (
        f"Driver={driver};"
        f"Server=tcp:{server},{port};"
        f"Database={db};"
        f"Uid={user};Pwd={password};"
        f"Encrypt={encrypt};TrustServerCertificate={trust};"
        f"Connection Timeout=30;"
    )


def get_connection() -> pyodbc.Connection:
    """Create a new pyodbc connection. Rely on ODBC pooling; keep scopes short."""
    try:
        cs = _build_connection_string()
        app.logger.debug(f"connectsting [{cs}]")
        # Autocommit off by default; safe for SELECTs, explicit commits for writes if needed.
        return pyodbc.connect(cs)
    except pyodbc.Error as e:
        logging.getLogger().error("Database connection error: %s", e)
        raise


# -----------------------------------------------------------------------------
# SQL helper functions
# -----------------------------------------------------------------------------

def _rows_as_dicts(cursor: pyodbc.Cursor) -> List[Dict[str, Any]]:
    """Convert a pyodbc cursor result set into a list of dicts."""
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def sql_all(query: str, params: Optional[Tuple[Any, ...]] = None) -> List[Dict[str, Any]]:
    """
    Execute a SELECT and return all rows as a list of dicts.
    Use parameterized queries: sql_all("SELECT * FROM t WHERE id = ?", (some_id,))
    """
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        return _rows_as_dicts(cur)


def sql_one(query: str, params: Optional[Tuple[Any, ...]] = None) -> Optional[Dict[str, Any]]:
    """Execute a SELECT and return a single row (or None)."""
    with get_connection() as conn:
        cur = conn.cursor()
        cur.execute(query, params or ())
        columns = [d[0] for d in cur.description]
        row = cur.fetchone()
        return dict(zip(columns, row)) if row else None


# -----------------------------------------------------------------------------
# Domain assembling
# -----------------------------------------------------------------------------

def get_actions() -> List[Dict[str, Any]]:
    """
    Fetch actions and attach their inputs/outputs/sources and item details.

    Shape (per action):
      {
        ...action columns,
        "inputs":  [{ "item": <item row>, "qty": <int> }, ...],
        "outputs": [{ "item": <item row>, "qty": <int> }, ...],
        "sources": [ <source row>, ... ]
      }
    """
    # Pull denormalized tables up-front to avoid N+1 queries
    raw_actions   = sql_all("SELECT * FROM dbo.[action]")
    raw_inputs    = sql_all("SELECT * FROM dbo.action_input")
    raw_outputs   = sql_all("SELECT * FROM dbo.action_output")
    raw_src_map   = sql_all("SELECT * FROM dbo.action_source")
    raw_sources   = sql_all("SELECT * FROM dbo.[source]")
    raw_items     = sql_all("SELECT * FROM dbo.item")

    # Build fast lookup maps
    item_by_id   = {r["id"]: r for r in raw_items}
    source_by_id = {r["id"]: r for r in raw_sources}

    # Group inputs/outputs/sources by action_id for O(1) assembly
    inputs_by_action: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for r in raw_inputs:
        inputs_by_action[r["action_id"]].append({"item_id": r["item_id"], "qty": r["qty"]})

    outputs_by_action: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for r in raw_outputs:
        outputs_by_action[r["action_id"]].append({"item_id": r["item_id"], "qty": r["qty"]})

    sources_by_action: Dict[str, List[str]] = defaultdict(list)
    for r in raw_src_map:
        sources_by_action[r["action_id"]].append(r["source_id"])

    # Assemble final shape
    for a in raw_actions:
        aid = a["id"]

        a_inputs = inputs_by_action.get(aid, [])
        a_outputs = outputs_by_action.get(aid, [])
        a_sources = sources_by_action.get(aid, [])

        a["inputs"] = [{"item": item_by_id.get(i["item_id"]), "qty": i["qty"]} for i in a_inputs]
        a["outputs"] = [{"item": item_by_id.get(o["item_id"]), "qty": o["qty"]} for o in a_outputs]
        a["sources"] = [source_by_id.get(sid) for sid in a_sources if sid in source_by_id]

    logging.getLogger().debug("Assembled actions: %d", len(raw_actions))
    return raw_actions


# -----------------------------------------------------------------------------
# Entrypoint
# -----------------------------------------------------------------------------

app = create_app()

if __name__ == "__main__":
    # Bind host/port via env (defaults keep your original behavior)
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", "8080"))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    app.logger.info("Running on http://%s:%s (debug=%s)", host, port, debug)
    app.run(host=host, port=port, debug=debug)
