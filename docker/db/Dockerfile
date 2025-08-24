# Microsoft SQL Server 2022 (Linux)
FROM mcr.microsoft.com/mssql/server:2022-latest

# Akzeptiere EULA + Edition (Developer = kostenlos für Dev/Test)
ENV ACCEPT_EULA=Y \
    MSSQL_PID=Developer

# Port für SQL Server
EXPOSE 1433

# WICHTIG: Kein Passwort im Image hinterlegen! (kommt aus docker-compose)
# Daten liegen im Container unter /var/opt/mssql
