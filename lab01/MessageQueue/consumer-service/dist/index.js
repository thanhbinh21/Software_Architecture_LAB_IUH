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
    console.log("✅ Consumer connected to Redis");
});
app.get("/orders", async (req, res) => {
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
//# sourceMappingURL=index.js.map