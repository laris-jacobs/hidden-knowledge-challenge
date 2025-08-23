FROM ubuntu:25.10 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg build-essential nodejs npm

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund;

COPY . .

RUN npm run build


FROM ubuntu:25.10 AS runtime

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends nginx \
 && rm -rf /var/lib/apt/lists/*

RUN rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-available/default || true
COPY nginx.conf /etc/nginx.conf

COPY --from=builder /app/dist/ /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

CMD nginx -g 'daemon off;'
