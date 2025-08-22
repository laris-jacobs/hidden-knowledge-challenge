FROM ubuntu:24.04

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv curl

run apt-get install -y unixodbc

RUN pip3 install --break-system-packages uv

WORKDIR /backend
COPY installodbc.sh .
RUN chmod +x installodbc.sh && ./installodbc.sh
COPY . /backend
RUN uv sync
# Expose port
EXPOSE 8080

# Run Flask app using uvx
CMD ["uv",  "run", "app.py"]
