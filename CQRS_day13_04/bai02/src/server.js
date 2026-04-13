const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

// Domain
const { OrderStore } = require("./domain/orderStore");
const { OrderReadModel } = require("./domain/orderReadModel");

// Events
const { EventBus } = require("./events/eventBus");

// Commands
const { createOrderCommand } = require("./commands/createOrder");
const { cancelOrderCommand } = require("./commands/cancelOrder");

// Queries
const { getOrdersQuery } = require("./queries/getOrders");
const { getOrderByIdQuery } = require("./queries/getOrderById");

// --- bootstrap ---
const eventBus = new EventBus();
const store = new OrderStore();
const readModel = new OrderReadModel(eventBus);

const PORT = process.env.PORT || 3001;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

// ── helpers ─────────────────────────────────────────────────────────────
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

function matchOrderById(pathname) {
  const match = pathname.match(/^\/orders\/([^/]+)$/);
  return match ? match[1] : null;
}

// ── HTTP server ─────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method;

  try {
    // ── static files ──
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
    if (method === "GET" && pathname === "/favicon.ico") {
      sendEmpty(res, 204);
      return;
    }

    // ── API info ──
    if (method === "GET" && pathname === "/api") {
      sendJson(res, 200, {
        message: "Order CQRS API with Events",
        endpoints: {
          commands: ["POST /orders", "PATCH /orders/:id/cancel"],
          queries: ["GET /orders", "GET /orders/:id"],
          events: ["GET /events"]
        }
      });
      return;
    }

    // ── QUERIES ─────────────────────────────────────────────────────────
    // GET /orders  → list all orders (read model)
    if (method === "GET" && pathname === "/orders") {
      const result = getOrdersQuery(readModel);
      sendJson(res, 200, result.data);
      return;
    }

    // GET /orders/:id  → single order (read model)
    if (method === "GET") {
      const id = matchOrderById(pathname);
      if (id) {
        const result = getOrderByIdQuery(readModel, id);
        if (result.error) {
          sendJson(res, result.status || 400, { message: result.error });
          return;
        }
        sendJson(res, 200, result.data);
        return;
      }
    }

    // GET /events  → event log
    if (method === "GET" && pathname === "/events") {
      sendJson(res, 200, eventBus.getLog());
      return;
    }

    // ── COMMANDS ────────────────────────────────────────────────────────
    // POST /orders  → create order
    if (method === "POST" && pathname === "/orders") {
      const payload = await readJson(req);
      const result = createOrderCommand(store, eventBus, payload);
      if (result.error) {
        sendJson(res, 400, { message: result.error });
        return;
      }
      sendJson(res, 201, result.data);
      return;
    }

    // PATCH /orders/:id/cancel  → cancel order
    const cancelMatch = pathname.match(/^\/orders\/([^/]+)\/cancel$/);
    if (method === "PATCH" && cancelMatch) {
      const id = cancelMatch[1];
      const result = cancelOrderCommand(store, eventBus, id);
      if (result.error) {
        sendJson(res, result.status || 400, { message: result.error });
        return;
      }
      sendJson(res, 200, result.data);
      return;
    }

    // ── 404 ─────────────────────────────────────────────────────────────
    sendJson(res, 404, { message: "Route not found." });
  } catch (error) {
    if (error.message === "Invalid JSON body.") {
      sendJson(res, 400, { message: error.message });
      return;
    }
    console.error(error);
    sendJson(res, 500, { message: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Order CQRS API is running at http://localhost:${PORT}`);
});
