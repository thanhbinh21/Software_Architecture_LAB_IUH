import express, { Request, Response } from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const redisClient = createClient({
  url: "redis://localhost:6379"
});

redisClient.connect().then(() => {
  console.log("✅ Consumer connected to Redis");
});

app.get("/orders", async (req: Request, res: Response) => {
  const message = await redisClient.rPop("order_queue");

  if (!message) {
    return res.json({
      status: "NO_ORDERS",
      data: null
    });
  }

  console.log("📥 Consumer received:", message);

  res.json({
    status: "SUCCESS",
    data: JSON.parse(message)
  });
});

app.listen(3001, () => {
  console.log("🚀 Consumer Service running at http://localhost:3001");
});
