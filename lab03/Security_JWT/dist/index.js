"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Secret keys
const ACCESS_TOKEN_SECRET = "access_secret_key_12345";
const REFRESH_TOKEN_SECRET = "refresh_secret_key_67890";
const users = [];
const refreshTokens = [];
// ============ REGISTER ============
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({
                status: "ERROR",
                message: "Username, email, and password are required"
            });
        }
        // Check if user exists
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(400).json({
                status: "ERROR",
                message: "User already exists"
            });
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password: hashedPassword
        };
        users.push(newUser);
        console.log("📝 User registered:", { id: newUser.id, username, email });
        res.status(201).json({
            status: "SUCCESS",
            message: "User registered successfully",
            data: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});
// ============ LOGIN ============
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validation
        if (!username || !password) {
            return res.status(400).json({
                status: "ERROR",
                message: "Username and password are required"
            });
        }
        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid username or password"
            });
        }
        // Check password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid username or password"
            });
        }
        // Create tokens
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email
        };
        const accessToken = jsonwebtoken_1.default.sign(payload, ACCESS_TOKEN_SECRET, {
            expiresIn: "15m"
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, REFRESH_TOKEN_SECRET, {
            expiresIn: "7d"
        });
        refreshTokens.push(refreshToken);
        console.log("✅ User logged in:", username);
        res.json({
            status: "SUCCESS",
            message: "Login successful",
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});
// ============ REFRESH TOKEN ============
app.post("/refresh", (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({
                status: "ERROR",
                message: "Refresh token is required"
            });
        }
        // Check if refresh token exists
        if (!refreshTokens.includes(refreshToken)) {
            return res.status(401).json({
                status: "ERROR",
                message: "Invalid refresh token"
            });
        }
        // Verify refresh token
        const decoded = jsonwebtoken_1.default.verify(refreshToken, REFRESH_TOKEN_SECRET);
        // Create new access token
        const newAccessToken = jsonwebtoken_1.default.sign({
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        }, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
        console.log("🔄 Token refreshed for:", decoded.username);
        res.json({
            status: "SUCCESS",
            message: "Token refreshed",
            data: {
                accessToken: newAccessToken
            }
        });
    }
    catch (error) {
        res.status(401).json({
            status: "ERROR",
            message: "Invalid refresh token"
        });
    }
});
// ============ VERIFY TOKEN ============
app.post("/verify", (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({
                status: "ERROR",
                message: "Access token is required"
            });
        }
        const decoded = jsonwebtoken_1.default.verify(accessToken, ACCESS_TOKEN_SECRET);
        console.log("✔️ Token verified for:", decoded.username);
        res.json({
            status: "SUCCESS",
            message: "Token is valid",
            data: decoded
        });
    }
    catch (error) {
        res.status(401).json({
            status: "ERROR",
            message: "Invalid or expired token"
        });
    }
});
// ============ LOGOUT ============
app.post("/logout", (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const index = refreshTokens.indexOf(refreshToken);
            if (index > -1) {
                refreshTokens.splice(index, 1);
            }
        }
        console.log("👋 User logged out");
        res.json({
            status: "SUCCESS",
            message: "Logout successful"
        });
    }
    catch (error) {
        res.status(500).json({
            status: "ERROR",
            message: error.message
        });
    }
});
// ============ GET USERS (for testing) ============
app.get("/users", (req, res) => {
    const usersList = users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email
    }));
    res.json({
        status: "SUCCESS",
        data: usersList
    });
});
app.listen(4000, () => {
    console.log("🚀 JWT Auth Service running at http://localhost:4000");
    console.log("\n📝 Endpoints:");
    console.log("  POST   /register    - Đăng kí (Register)");
    console.log("  POST   /login       - Đăng nhập (Login)");
    console.log("  POST   /refresh     - Trao đổi JWT (Refresh Token)");
    console.log("  POST   /verify      - Kiểm tra JWT (Verify Token)");
    console.log("  POST   /logout      - Đăng xuất (Logout)");
    console.log("  GET    /users       - Danh sách user (List Users)");
});
//# sourceMappingURL=index.js.map