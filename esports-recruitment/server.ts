import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const DB_PATH = path.join(process.cwd(), "users_db.json");

// Helper to hash passwords using SHA-256
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface DBUser {
  id: string;
  player_id: string;
  username: string;
  fullname: string;
  email: string;
  passwordHash: string;
  high_score: number;
}

// Read JSON database
function readDB(): DBUser[] {
  if (!fs.existsSync(DB_PATH)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

// Write JSON database
function writeDB(users: DBUser[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(users, null, 2), "utf-8");
}

// In-memory active session tokens mapping to users
const SESSIONS: Record<string, DBUser> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // API ROUTES

  // Register Player Account
  app.post("/api/register", (req, res) => {
    try {
      const { fullname, email, username, password } = req.body;
      if (!fullname || !email || !username || !password) {
        return res.status(400).json({ status: "error", message: "กรุณากรอกข้อมูลให้ครบถ้วน!" });
      }

      const users = readDB();
      const userExists = users.some(
        u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
      );

      if (userExists) {
        return res.status(400).json({ status: "error", message: "ชื่อผู้ใช้หรืออีเมลนี้ได้รับการลงทะเบียนแล้ว!" });
      }

      // Generate a unique player_id
      let isUnique = false;
      let player_id = "";
      while (!isUnique) {
        const rand = Math.floor(10000 + Math.random() * 90000);
        player_id = `NXS-${rand}`;
        if (!users.some(u => u.player_id === player_id)) {
          isUnique = true;
        }
      }

      const newUser: DBUser = {
        id: crypto.randomUUID(),
        player_id,
        username,
        fullname,
        email,
        passwordHash: hashPassword(password),
        high_score: 0
      };

      users.push(newUser);
      writeDB(users);

      return res.json({
        status: "success",
        message: "ลงทะเบียนสมาชิกสำเร็จ!",
        username,
        player_id
      });
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด: " + error.message });
    }
  });

  // Login
  app.post("/api/login", (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ status: "error", message: "กรุณากรอกข้อมูลให้ครบถ้วน!" });
      }

      const users = readDB();
      const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(400).json({ status: "error", message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!" });
      }

      // Generate session token
      const token = crypto.randomBytes(32).toString("hex");
      SESSIONS[token] = user;

      return res.json({
        status: "success",
        token,
        user: {
          id: user.id,
          player_id: user.player_id,
          username: user.username,
          fullname: user.fullname,
          email: user.email,
          high_score: user.high_score
        }
      });
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด: " + error.message });
    }
  });

  // Get User Session details (Self query)
  app.get("/api/session", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.json({ isLoggedIn: false });
    }
    const token = authHeader.replace("Bearer ", "");
    const sessionUser = SESSIONS[token];
    if (!sessionUser) {
      return res.json({ isLoggedIn: false });
    }

    // Load fresh data from DB to reflect any updated high score
    const users = readDB();
    const freshUser = users.find(u => u.id === sessionUser.id);
    if (!freshUser) {
      return res.json({ isLoggedIn: false });
    }

    return res.json({
      isLoggedIn: true,
      user: {
        id: freshUser.id,
        player_id: freshUser.player_id,
        username: freshUser.username,
        fullname: freshUser.fullname,
        email: freshUser.email,
        high_score: freshUser.high_score
      }
    });
  });

  // Save/Update High Score
  app.post("/api/save-score", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ status: "error", message: "กรุณาล็อกอินก่อนบันทึกคะแนน" });
      }
      const token = authHeader.replace("Bearer ", "");
      const sessionUser = SESSIONS[token];
      if (!sessionUser) {
        return res.status(401).json({ status: "error", message: "เซสชันหมดอายุ กรุณาล็อกอินใหม่" });
      }

      const { score } = req.body;
      const numericScore = parseInt(score, 10);
      if (isNaN(numericScore) || numericScore < 0) {
        return res.status(400).json({ status: "error", message: "ข้อมูลคะแนนไม่ถูกต้อง" });
      }

      const users = readDB();
      const userIndex = users.findIndex(u => u.id === sessionUser.id);
      if (userIndex === -1) {
        return res.status(404).json({ status: "error", message: "ไม่พบผู้ใช้ในระบบ" });
      }

      const currentHigh = users[userIndex].high_score;
      let updated = false;

      // Update ONLY if new score is higher than current record
      if (numericScore > currentHigh) {
        users[userIndex].high_score = numericScore;
        writeDB(users);
        updated = true;
      }

      return res.json({
        status: "success",
        updated,
        current_high: updated ? numericScore : currentHigh,
        new_high_score: users[userIndex].high_score
      });
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: "เซิร์ฟเวอร์เกิดข้อผิดพลาด: " + error.message });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      delete SESSIONS[token];
    }
    return res.json({ status: "success" });
  });

  // Integration of Vite Dev Server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express v4, wildcard route is '*'
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Full-stack Esports Recruitment running on port ${PORT}`);
  });
}

startServer();
