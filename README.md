# Minecraft Knowledge DB

A proof-of-concept for detecting **hidden knowledge** and **conflicts** in Minecraft crafting recipes.
Read more about it [here](docs/CHALLENGE.md).

Built with ❤️ during the **Bärn Häckt Hackathon 🐻**

## Project Setup

This is a **mono-repo** containing both backend and frontend.

- **Frontend**: Angular
- **Backend**: Python with Flask
- **Database**: MS SQL (with tsql) - graph-like schema using recursive queries

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- Node.js + npm (for running the Angular frontend locally)
- Python 3.10+ (for running the Flask backend locally)

### Run the database locally

Start the database by running:

```bash
cd docker
docker-compose up -d 
```

Set your SA password for the commands below (must meet MSSQL password policy):

```bash
export SA_PASSWORD='YourStrong@Passw0rd!'
```

First, load the schema into the MSSQL database:

```bash
cat backend/sql/schema.sql | docker exec -i mc-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -d mcdb -b
```

Then load the seed data:

```bash
find backend/sql -maxdepth 1 -type f -name '*.sql' ! -name 'schema.sql' -print0 | xargs -0 cat | docker exec -i mc-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$SA_PASSWORD" -C -d mcdb -b
```

###  Run the backend:
```bash
cd backend
pip install -r requirements.txt
flask run
```

###  Run the frontend:
```bash
cd frontend
npm install
npm start
```

Then open the app at http://localhost:4200

## Further Documentation

- [Database schema](docs/SCHEMA.md)
- [Continuous Integration](docs/CI.md)

## Test on production environment

The production test instance is available at: <http://74.161.161.50/>.

**Note:** This environment is temporary and may be shut down after the hackathon. Do not rely on it for long-term availability; data may be reset or removed without notice.
