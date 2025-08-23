FROM ubuntu:25.10 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg build-essential nodejs npm

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund;

COPY . .

RUN npm run build

FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist/  /usr/share/nginx/html


