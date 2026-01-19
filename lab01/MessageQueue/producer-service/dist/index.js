"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const redisClient = (0, redis_1.createClient)({
    url: "redis://localhost:6379"
});
redisClient.connect().then(() => {
    console.log("✅ Producer connected to Redis");
});
app.post("/send", async (req, res) => {
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
//# sourceMappingURL=index.js.map