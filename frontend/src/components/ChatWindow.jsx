import { useState, useEffect, useRef } from "react";
import API from "../api/axios";
import { io } from "socket.io-client";
import { Send, User, Clock, MessageSquare } from "lucide-react";

const ChatWindow = ({ channelId, currentUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollBoxRef = useRef(null);
  const socketRef = useRef(null);

  const loadMessages = async (pageNumber) => {
    const res = await API.get(
      `/api/messages/${channelId}?page=${pageNumber}&limit=20`
    );

    if (pageNumber === 1) {
      setMessages(res.data.messages);
    } else {
      setMessages((prev) => [...res.data.messages, ...prev]);
    }

    setHasMore(res.data.hasMore);
  };

  // 1. Initialize Socket Connection (Once)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (!socketRef.current) {
      const socket = io(`${import.meta.env.VITE_BACKEND_URL.replace(/\/api\/?$/, "")}`, {
        transports: ["websocket", "polling"],
        auth: { token }
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🔥 SOCKET CONNECTED:", socket.id);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ SOCKET CONNECTION ERROR:", err.message);
      });
    }

    return () => {
      // Optional: disconnect on unmount if desired, but often better to keep alive for SPA
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 2. Handle Channel Events & Message Listening (When channelId changes)
  useEffect(() => {
    if (!socketRef.current || !channelId) return;
    const socket = socketRef.current;

    // Join new channel
    socket.emit("joinChannel", channelId);

    // Handler for new messages - uses current channelId scope
    const handleNewMessage = (msg) => {
      if (msg.channelId === channelId) {
        setMessages((prev) => [...prev, msg]);
        scrollToBottom();
      }
    };

    // Attach listener
    socket.on("newMessage", handleNewMessage);

    // Cleanup: leave channel and remove listener
    return () => {
      socket.emit("leaveChannel", channelId);
      socket.off("newMessage", handleNewMessage);
    };
  }, [channelId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setPage(1);
    loadMessages(1);
  }, [channelId]);

  const handleScroll = () => {
    const scrollTop = scrollBoxRef.current.scrollTop;

    if (scrollTop === 0 && hasMore) {
      const oldHeight = scrollBoxRef.current.scrollHeight;
      const nextPage = page + 1;

      setPage(nextPage);

      loadMessages(nextPage).then(() => {
        const newHeight = scrollBoxRef.current.scrollHeight;
        scrollBoxRef.current.scrollTop = newHeight - oldHeight;
      });
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    const messageText = text.trim();
    setText("");
    setIsTyping(true);

    socketRef.current.emit(
      "sendMessage",
      { channelId, text: messageText },
      (ack) => {
        console.log("Message sent ack:", ack);
        setIsTyping(false);
      }
    );

    // Fallback: reset typing indicator after 5 seconds if no ack received
    setTimeout(() => {
      setIsTyping(false);
    }, 5000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full `bg-gradient-to-b` from-slate-900 to-slate-800 relative">

      {/* BACK BUTTON */}
      <button
        className="absolute top-6 left-6 px-4 py-2 bg-white/10 hover:bg-white/20
                   text-white rounded-lg backdrop-blur-md border border-white/20
                   transition-all z-10"
        onClick={() => onBack()}
      >
        ← Back
      </button>

      {/* MESSAGE LIST */}
      <div
        className="flex-1 overflow-y-auto p-6 pt-24 space-y-4"
        ref={scrollBoxRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl text-center">
              <MessageSquare className="h-16 w-16 text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No messages yet
              </h3>
              <p className="text-gray-300">Start the conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwnMessage = msg.sender?._id === currentUser.id;

            return (
              <div
                key={msg._id || index}
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
              >
                <div className={`flex max-w-[70%] ${isOwnMessage ? "flex-row-reverse" : "flex-row"} items-end gap-3`}>

                  {/* Avatar */}
                  <div className="`flex-shrink-0`">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${isOwnMessage
                        ? "bg-gradient-to-r from-purple-500 to-blue-500"
                        : "bg-gradient-to-r from-green-500 to-teal-500"
                        }`}
                    >
                      {msg.sender?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`relative ${isOwnMessage
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "backdrop-blur-xl bg-white/10 border border-white/20 text-white"
                      } rounded-2xl px-4 py-3 shadow-lg`}
                  >
                    {/* Username */}
                    <div
                      className={`text-xs font-semibold mb-1 flex items-center gap-1 ${isOwnMessage ? "text-purple-200" : "text-gray-300"
                        }`}
                    >
                      <User className="h-3 w-3" />
                      {msg.sender?.username}
                    </div>

                    {/* Text */}
                    <div className="text-sm leading-relaxed">{msg.text}</div>

                    {/* Timestamp */}
                    <div
                      className={`text-xs mt-2 flex items-center gap-1 ${isOwnMessage ? "text-purple-200" : "text-gray-400"
                        }`}
                    >
                      <Clock className="h-3 w-3" />
                      {formatTime(msg.createdAt)}
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}

        <div ref={messagesEndRef}></div>
      </div>

      {/* MESSAGE INPUT */}
      <div className="p-6 backdrop-blur-xl bg-white/5 border-t border-white/10">
        <div className="flex gap-3">

          <div className="flex-1 relative">
            <input
              className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            {isTyping && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-100"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce animation-delay-200"></div>
              </div>
            )}
          </div>

          <button
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 
            hover:from-purple-700 hover:to-blue-700 text-white rounded-xl transition-all duration-200 
            transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
            flex items-center gap-2 shadow-lg"
            onClick={sendMessage}
            disabled={!text.trim() || isTyping}
          >
            <Send className="h-5 w-5" />
          </button>

        </div>
      </div>

    </div>
  );
};

export default ChatWindow;
