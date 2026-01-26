const express = require("express");
const redis = require("redis");

const app = express();
const PORT = 3000;

// Redis client
const client = redis.createClient();

client.on("error", (err) => console.log("Redis error:", err));

(async () => {
  await client.connect();
})();

// Fake DB / heavy logic (3s)
function heavyTask() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: "Very expensive data",
      });
    }, 3000);
  });
}

app.get("/data", async (req, res) => {
  const start = Date.now(); // ⏱️ start time
  const cacheKey = "data";

  // 1️⃣ Cache HIT
  const cachedData = await client.get(cacheKey);
  if (cachedData) {
    const duration = Date.now() - start;

    return res.send(`
      <h2 style="color:green">🚀 CACHE HIT</h2>
      <p><b>Source:</b> Redis Cache</p>
      <p><b>Response time:</b> ${duration} ms</p>
      <pre>${cachedData}</pre>
    `);
  }

  // 2️⃣ Cache MISS
  const result = await heavyTask();
  await client.setEx(cacheKey, 60, JSON.stringify(result));

  const duration = Date.now() - start;

  res.send(`
    <h2 style="color:red">🐌 CACHE MISS</h2>
    <p><b>Source:</b> Server (heavy task)</p>
    <p><b>Response time:</b> ${duration} ms</p>
    <pre>${JSON.stringify(result)}</pre>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
