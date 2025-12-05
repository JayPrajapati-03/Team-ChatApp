import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { connectDB } from "./config.js";
import { Message } from "./models/Message.js";
import { ChannelMember } from "./models/ChannelMember.js";
import { User } from "./models/User.js";
import authRoutes from "./routes/authRoutes.js";
import channelRoutes from "./routes/channelRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import presenceRoutes from "./routes/presenceRoutes.js";

import {
  addOnlineUser,
  removeOnlineUser,
  getOnlineUsers,
  isUserOnline
} from "./utils/onlineUsers.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/presence", presenceRoutes);

// SERVER
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Authorization"]
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000
});

io.on("connection", async (socket) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      console.log("❌ No token sent. Disconnecting...");
      socket.disconnect();
      return;
    }

    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.log("❌ Invalid JWT:", err.message);
      socket.disconnect();
      return;
    }

    const userId = userData.id;
    socket.data.userId = userId;
    socket.data.username = userData.username;

    console.log(`✅ Socket connected: ${socket.id} (user ${userId})`);

    addOnlineUser(userId, socket.id);

    const onlineUserIds = getOnlineUsers();
    const allUsers = await User.find({}).select("username email _id");
    const usersWithStatus = allUsers.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      isOnline: onlineUserIds.includes(user._id.toString())
    }));

    io.emit("presenceUpdate", {
      userId,
      isOnline: true,
      users: usersWithStatus
    });

    socket.on("joinChannel", async (channelId) => {
      if (!channelId) return;
      socket.join(channelId);
      console.log(`👉 ${socket.id} joined channel: ${channelId}`);
    });

    socket.on("leaveChannel", (channelId) => {
      socket.leave(channelId);
    });

    socket.on("sendMessage", async ({ channelId, text }) => {
      if (!channelId || !text) return;

      const message = await Message.create({
        channelId,
        senderId: userId,
        text
      });

      const populated = await message.populate("senderId", "username _id");

      io.to(channelId).emit("newMessage", {
        _id: populated._id,
        channelId: populated.channelId,
        sender: {
          _id: populated.senderId._id,
          username: populated.senderId.username
        },
        text: populated.text,
        createdAt: populated.createdAt
      });
    });

    socket.on("disconnect", async (reason) => {
      console.log(`❌ Socket disconnected: ${socket.id} (user ${userId}), reason: ${reason}`);

      removeOnlineUser(userId, socket.id);

      const stillOnline = isUserOnline(userId);

      const onlineUserIds = getOnlineUsers();
      const allUsers = await User.find({}).select("username email _id");

      const usersWithStatus = allUsers.map(user => ({
        _id: user._id,
        username: user.username,
        email: user.email,
        isOnline: onlineUserIds.includes(user._id.toString())
      }));

      io.emit("presenceUpdate", {
        userId,
        isOnline: stillOnline,
        users: usersWithStatus
      });

      console.log(`❌ User disconnected: ${userId}, emitting presenceUpdate`);
    });

  } catch (err) {
    console.error("Socket connection error:", err);
  }
});

connectDB();

app.get("/", (req, res) => res.send("Backend running!"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🔥 Server running on http://localhost:${PORT}`)
);
