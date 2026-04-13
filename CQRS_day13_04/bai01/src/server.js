const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");
const { TodoStore } = require("./domain/todoStore");
const { createTodoCommand } = require("./commands/createTodo");
const { updateTodoCommand } = require("./commands/updateTodo");
const { deleteTodoCommand } = require("./commands/deleteTodo");
const { getTodosQuery } = require("./queries/getTodos");
const { getTodoByIdQuery } = require("./queries/getTodoById");

const store = new TodoStore();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode);
  res.end();
}

function sendFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { message: "File not found." });
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (_err) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function matchTodoById(pathname) {
  const match = pathname.match(/^\/todos\/([^/]+)$/);
  return match ? match[1] : null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method;

  try {
    if (method === "GET" && pathname === "/") {
      sendFile(res, path.join(PUBLIC_DIR, "index.html"), "text/html; charset=utf-8");
      return;
    }

    if (method === "GET" && pathname === "/styles.css") {
      sendFile(res, path.join(PUBLIC_DIR, "styles.css"), "text/css; charset=utf-8");
      return;
    }

    if (method === "GET" && pathname === "/app.js") {
      sendFile(res, path.join(PUBLIC_DIR, "app.js"), "application/javascript; charset=utf-8");
      return;
    }

    if (method === "GET" && pathname === "/api") {
      sendJson(res, 200, {
        message: "Todo CQRS API",
        endpoints: {
          commands: ["POST /todos", "PUT /todos/:id", "DELETE /todos/:id"],
          queries: ["GET /todos", "GET /todos/:id"]
        }
      });
      return;
    }

    if (method === "GET" && pathname === "/favicon.ico") {
      sendEmpty(res, 204);
      return;
    }

    if (method === "GET" && pathname === "/todos") {
      const result = getTodosQuery(store);
      sendJson(res, 200, result.data);
      return;
    }

    if (method === "GET") {
      const id = matchTodoById(pathname);
      if (id) {
        const result = getTodoByIdQuery(store, id);
        if (result.error) {
          sendJson(res, result.status || 400, { message: result.error });
          return;
        }
        sendJson(res, 200, result.data);
        return;
      }
    }

    if (method === "POST" && pathname === "/todos") {
      const payload = await readJson(req);
      const result = createTodoCommand(store, payload);
      if (result.error) {
        sendJson(res, 400, { message: result.error });
        return;
      }
      sendJson(res, 201, result.data);
      return;
    }

    if (method === "PUT") {
      const id = matchTodoById(pathname);
      if (id) {
        const payload = await readJson(req);
        const result = updateTodoCommand(store, id, payload);
        if (result.error) {
          sendJson(res, result.status || 400, { message: result.error });
          return;
        }
        sendJson(res, 200, result.data);
        return;
      }
    }

    if (method === "DELETE") {
      const id = matchTodoById(pathname);
      if (id) {
        const result = deleteTodoCommand(store, id);
        if (result.error) {
          sendJson(res, result.status || 404, { message: result.error });
          return;
        }
        sendEmpty(res, 204);
        return;
      }
    }

    sendJson(res, 404, { message: "Route not found." });
  } catch (error) {
    if (error.message === "Invalid JSON body.") {
      sendJson(res, 400, { message: error.message });
      return;
    }
    sendJson(res, 500, { message: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Todo CQRS API is running at http://localhost:${PORT}`);
});
