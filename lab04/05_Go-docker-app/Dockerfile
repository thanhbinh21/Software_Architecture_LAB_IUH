# Stage 1: Build Go app
FROM golang:1.21-alpine AS builder

WORKDIR /app

COPY . .

RUN go mod init hello-go
RUN go mod tidy

RUN go build -o app


# Stage 2: Run binary
FROM alpine:latest

WORKDIR /root/

COPY --from=builder /app/app .

EXPOSE 8080

CMD ["./app"]