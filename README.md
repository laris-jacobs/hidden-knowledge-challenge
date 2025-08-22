# Minecraft Knowledge DB

A proof-of-concept for detecting **hidden knowledge** and **conflicts** in Minecraft crafting recipes.
Read more about it [here](docs/CHALLENGE.md).

Built with ❤️ during the **Bärn Häckt Hackathon 🐻**

## Project Setup

This is a **mono-repo** containing both backend and frontend.

- **Frontend**: Angular
- **Backend**: Python with Flask
- **Database**: PostgreSQL (graph-like schema using recursive queries)

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed
- Node.js + npm (for running the Angular frontend locally)
- Python 3.10+ (for running the Flask backend locally)

### Run the database

Start the database by running:

```bash
cd docker
docker-compose up -d
```

First, load the schema into the PostgreSQL database:

```bash
cat backend/sql/schema.sql | docker exec -i mc-db psql -U postgres -d mcdb
```

Then load the seed data:

```bash
cat backend/sql/data.sql | docker exec -i mc-db psql -U postgres -d mcdb
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
