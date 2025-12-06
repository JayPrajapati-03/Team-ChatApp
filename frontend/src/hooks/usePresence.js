import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

export const usePresence = () => {
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Setup Socket.io connection for presence
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");

    const s = io(import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, ""), {
      auth: { token },
    });

    setSocket(s);

    // Receive presence updates
    s.on("presenceUpdate", (data) => {
      console.log("Presence update received:", data);
      setUsers(data.users);
    });

    // Heartbeat mechanism to detect inactive connections
    const heartbeat = setInterval(() => {
      if (s.connected) {
        s.emit("heartbeat");
      }
    }, 30000);

    // Explicit disconnect on page unload
    const handleBeforeUnload = () => {
      console.log("Page unloading, disconnecting socket");
      s.disconnect();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      s.disconnect();
    };
  }, [user]);

  // Fetch initial users from API
  useEffect(() => {
    const load = async () => {
      const res = await API.get("/api/presence");
      setUsers(res.data.onlineUsers);
    };
    load();
  }, []);

  return { onlineUsers: users, socket };
};
