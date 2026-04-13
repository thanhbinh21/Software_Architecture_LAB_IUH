const http = require("http");
const { URL } = require("url");
const { OrderReadModel } = require("./orderReadModel");
const fs = require("fs");
const path = require("path");

module.exports = function startQueryService(eventBus, port) {
  const readModel = new OrderReadModel(eventBus);
  const PUBLIC_DIR = path.join(__dirname, "..", "public");

  const server = http.createServer((req, res) => {
    // Basic CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;
    const method = req.method;

    const send = (code, data) => { res.writeHead(code, {"Content-Type":"application/json"}); res.end(JSON.stringify(data)); };
    const sendFile = (file, type) => fs.readFile(file, (err, d) => { if(err){ send(404, {}); return; } res.writeHead(200, {"Content-Type":type}); res.end(d); });

    // Host Frontend from Query Service for simplicity
    if (method === "GET" && pathname === "/") return sendFile(path.join(PUBLIC_DIR, "index.html"), "text/html");
    if (method === "GET" && pathname === "/styles.css") return sendFile(path.join(PUBLIC_DIR, "styles.css"), "text/css");
    if (method === "GET" && pathname === "/app.js") return sendFile(path.join(PUBLIC_DIR, "app.js"), "application/javascript");

    // Queries
    if (method === "GET" && pathname === "/orders") {
      return send(200, readModel.getAll());
    }
    const idMatch = pathname.match(/^\/orders\/([^/]+)$/);
    if (method === "GET" && idMatch) {
      const order = readModel.getById(idMatch[1]);
      return order ? send(200, order) : send(404, { error: "Not found" });
    }
    if (method === "GET" && pathname === "/events") {
      return send(200, eventBus.getLog());
    }

    send(404, { message: "Query Service Path not found" });
  });

  server.listen(port, () => console.log(`🔍 Query Service running on port ${port}`));
};
