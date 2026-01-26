import express, { Request, Response } from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const redisClient = createClient({
  url: "redis://localhost:6379"
});

redisClient.connect().then(() => {
  console.log("✅ Producer connected to Redis");
});

app.post("/send", async (req: Request, res: Response) => {
  const message = {
    id: Date.now(),
    payload: req.body,
    createdAt: new Date().toISOString()
  };

  await redisClient.lPush("order_queue", JSON.stringify(message));

  console.log("📤 Producer pushed:", message);

  res.json({
    status: "SUCCESS",
    data: message
  });
});

app.listen(3000, () => {
  console.log("🚀 Producer Service running at http://localhost:3000");
});
