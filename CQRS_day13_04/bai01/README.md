# Todo API (CQRS) - Ex1

## Run

```bash
node src/server.js
```

Server default: `http://localhost:3000`

UI test page: `http://localhost:3000/`

API info JSON: `http://localhost:3000/api`

## Command Endpoints

- `POST /todos` - create todo
- `PUT /todos/:id` - update todo
- `DELETE /todos/:id` - delete todo

## Query Endpoints

- `GET /todos` - get all todos
- `GET /todos/:id` - get todo detail

## Quick Test (PowerShell)

```powershell
# Create
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/todos" `
  -ContentType "application/json" `
  -Body '{"title":"Learn CQRS"}'

# List
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/todos"

# Detail
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/todos/1"

# Update
Invoke-RestMethod -Method Put -Uri "http://localhost:3000/todos/1" `
  -ContentType "application/json" `
  -Body '{"title":"Learn CQRS deeply","completed":true}'

# Delete
curl.exe -X DELETE "http://localhost:3000/todos/1"
```
