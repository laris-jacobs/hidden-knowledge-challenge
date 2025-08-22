FROM ubuntu:24.04

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv curl \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --break-system-packages uv
COPY . /backend
WORKDIR /backend



# Expose port
EXPOSE 8080

# Run Flask app using uvx
CMD ["uvx", "--from", "flask", "python", "app.py"]
