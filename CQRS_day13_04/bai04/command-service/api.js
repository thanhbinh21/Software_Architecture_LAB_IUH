const http = require("http");
const { URL } = require("url");
const { EventTypes } = require("../shared/eventBus");
const { OrderStore } = require("./orderStore");

function createOrderCommand(store, eventBus, payload) {
  const { customerName, items } = payload || {};
  if (!customerName || !items || items.length === 0) return { error: "Missing fields" };
  const order = store.create({ customerName, items });
  eventBus.emit(EventTypes.ORDER_CREATED, order);
  return { data: order };
}

function cancelOrderCommand(store, eventBus, id) {
  const order = store.cancel(id);
  if (!order) return { error: "Not found or already cancelled", status: 404 };
  eventBus.emit(EventTypes.ORDER_CANCELLED, order);
  return { data: order };
}

module.exports = function startCommandService(eventBus, port) {
  const store = new OrderStore();

  const server = http.createServer(async (req, res) => {
    // Basic CORS for frontend
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const { pathname } = url;
    const method = req.method;

    const readJson = () => new Promise(r => { let b = ""; req.on("data", c => b+=c); req.on("end", () => { try { r(b?JSON.parse(b):{});} catch { r({});} }); });
    const send = (code, data) => { res.writeHead(code, {"Content-Type":"application/json"}); res.end(JSON.stringify(data)); };

    try {
      if (method === "POST" && pathname === "/orders") {
        const payload = await readJson();
        const result = createOrderCommand(store, eventBus, payload);
        if (result.error) return send(400, result);
        console.log("[Command-Service] Created Order");
        return send(201, result.data);
      }
      const cancelMatch = pathname.match(/^\/orders\/([^/]+)\/cancel$/);
      if (method === "PATCH" && cancelMatch) {
        const result = cancelOrderCommand(store, eventBus, cancelMatch[1]);
        if (result.error) return send(result.status||400, result);
        console.log("[Command-Service] Cancelled Order");
        return send(200, result.data);
      }
      send(404, { message: "Command Service Path not found" });
    } catch (e) {
      send(500, { message: "Error" });
    }
  });

  server.listen(port, () => console.log(`🚀 Command Service running on port ${port}`));
};
