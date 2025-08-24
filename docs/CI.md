# Deployment (short)

This project deploys to the server via **GitHub Actions → SSH** and runs containers with **Docker Compose**.

## Prerequisites
- Server has Docker & Docker Compose installed
- Repository checked out on the server at: `/srv/deploy/hidden-knowledge-challenge`
- GitHub Secrets configured:
    - `SSH_HOST`, `USERNAME`, `PASSWORD` *(SSH key is recommended instead of password)*
- Project structure:
  ```
  .
  ├─ docker-compose.yml
  ├─ backend/   # Dockerfile
  └─ frontend/  # Dockerfile
  ```

## CI Workflow (GitHub Actions)

Triggered on push to `main` or manually.

```yaml
name: SSH Command Execution

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  ssh-command:
    runs-on: ubuntu-latest
    steps:
      - name: Execute SSH Command
        uses: appleboy/ssh-action@v1.2.2
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.USERNAME }}
          password: ${{ secrets.PASSWORD }}
          port: 22
          script: |
            cd /srv/deploy/hidden-knowledge-challenge
            git checkout -- .
            git pull -f
            docker compose build
            docker compose up -d
```

## Usage
- **Auto-deploy:** Push to `main`.
- **Manual run:** GitHub → *Actions* → select workflow → *Run workflow*.

## Rollback
On the server:
```bash
cd /srv/deploy/hidden-knowledge-challenge
git checkout <commit|tag>
docker compose build
docker compose up -d
```

## Troubleshooting
```bash
docker compose ps
docker compose logs -f <service>
```
