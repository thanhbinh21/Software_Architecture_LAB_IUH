FROM postgres:15

ENV POSTGRES_USER=admin
ENV POSTGRES_PASSWORD=secret
ENV POSTGRES_DB=mydb

COPY init.sql /docker-entrypoint-initdb.d/init.sql