const http = require("http");
const { URL } = require("url");
const fs = require("fs");
const path = require("path");

const { TicketStore } = require("./domain/ticketStore");
const { TicketReadModel } = require("./domain/ticketReadModel");
const { EventBus } = require("./events/eventBus");

const { bookTicketCommand } = require("./commands/bookTicket");
const { cancelTicketCommand } = require("./commands/cancelTicket");
const { getTicketsQuery } = require("./queries/getTickets");
const { searchTripsQuery } = require("./queries/searchTrips");

const eventBus = new EventBus();
const store = new TicketStore();
const readModel = new TicketReadModel(eventBus);

const PORT = 3002;
const PUBLIC_DIR = path.join(__dirname, "..", "public");

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data));
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
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error("Invalid JSON body.")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  const method = req.method;

  try {
    if (method === "GET" && pathname === "/") return sendFile(res, path.join(PUBLIC_DIR, "index.html"), "text/html");
    if (method === "GET" && pathname === "/styles.css") return sendFile(res, path.join(PUBLIC_DIR, "styles.css"), "text/css");
    if (method === "GET" && pathname === "/app.js") return sendFile(res, path.join(PUBLIC_DIR, "app.js"), "application/javascript");
    if (method === "GET" && pathname === "/favicon.ico") { res.writeHead(204); return res.end(); }

    // Queries
    if (method === "GET" && pathname === "/trips") {
      const q = url.searchParams.get("q") || "";
      return sendJson(res, 200, searchTripsQuery(q).data);
    }
    if (method === "GET" && pathname === "/tickets") {
      return sendJson(res, 200, getTicketsQuery(readModel).data);
    }
    if (method === "GET" && pathname === "/events") {
      return sendJson(res, 200, eventBus.getLog());
    }

    // Commands
    if (method === "POST" && pathname === "/tickets/book") {
      const payload = await readJson(req);
      const result = bookTicketCommand(store, eventBus, payload);
      if (result.error) return sendJson(res, 400, { message: result.error });
      return sendJson(res, 201, result.data);
    }
    const cancelMatch = pathname.match(/^\/tickets\/([^/]+)\/cancel$/);
    if (method === "PATCH" && cancelMatch) {
      const id = cancelMatch[1];
      const result = cancelTicketCommand(store, eventBus, id);
      if (result.error) return sendJson(res, result.status || 400, { message: result.error });
      return sendJson(res, 200, result.data);
    }

    sendJson(res, 404, { message: "Not found." });
  } catch (error) {
    if (error.message === "Invalid JSON body.") return sendJson(res, 400, { message: error.message });
    console.error(error);
    sendJson(res, 500, { message: "Internal server error." });
  }
});

server.listen(PORT, () => {
  console.log(`Train Ticket API is running at http://localhost:${PORT}`);
});
