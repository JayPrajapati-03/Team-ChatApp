import { useState, useEffect, useContext } from "react";
import API from "../api/axios";
import { usePresence } from "../hooks/usePresence";
import { AuthContext } from "../context/AuthContext";

const Sidebar = ({ selectedChannel, onSelectChannel }) => {
  const [channels, setChannels] = useState([]);
  const [newChannel, setNewChannel] = useState("");
  const [editChannel, setEditChannel] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { onlineUsers } = usePresence();
  const { logout } = useContext(AuthContext);

  const channelIcons = {
    fun: "🎉",
    general: "💬",
    coding: "💻",
    code: "💻",
    music: "🎵",
    songs: "🎵",
    gaming: "🎮",
    random: "✨",
    chat: "💭",
  };

  const getEmoji = (name) => {
    return channelIcons[name.toLowerCase()] || "📁";
  };

  const loadChannels = async () => {
    try {
      const res = await API.get("/channels");
      setChannels(res.data.channels);
    } catch (err) {
      console.error("Failed to load channels:", err);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  // CREATE
  const handleCreateChannel = async () => {
    if (!newChannel.trim()) return;

    try {
      await API.post("/channels/create", { name: newChannel });
      setNewChannel("");
      loadChannels();
    } catch (err) {
      console.error("Create channel error:", err);
    }
  };

  // UPDATE (Rename)
  const handleRenameChannel = async () => {
    if (!renameValue.trim()) return;

    try {
      await API.put(`/channels/update/${editChannel._id}`, {
        name: renameValue,
      });

      setEditChannel(null);
      setRenameValue("");
      loadChannels();
    } catch (err) {
      console.error("Rename error:", err);
    }
  };

  // DELETE
  const handleDeleteChannel = async () => {
    try {
      await API.delete(`/channels/delete/${deleteConfirm._id}`);

      setDeleteConfirm(null);
      loadChannels();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // JOIN
  const handleJoinChannel = async (channelId) => {
    try {
      const res = await API.post("/channels/join", { channelId });

      if (res.status === 200 || res.data.message === "Already a member") {
        onSelectChannel(channelId);
      } else {
        alert(res.data.message || "Failed to join channel");
      }
    } catch (err) {
      alert("Join channel error: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div
      className="
      w-72 h-full p-6 flex flex-col
      `bg-gradient-to-b from-[#0e1129] to-[#060814]
      backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.4)]
      border-r border-white/10
    "
    >
      <h2 className="text-2xl font-bold text-white drop-shadow mb-6">
        Channels
      </h2>

      {/* CREATE NEW CHANNEL */}
      <div
        className="
        flex gap-2 mb-6 p-2
        bg-white/5 rounded-xl backdrop-blur-sm
        shadow-inner shadow-black/40 border border-white/10
      "
      >
        <input
          className="
            flex-1 p-2 bg-transparent text-white
            placeholder-gray-400 outline-none
          "
          placeholder="New channel..."
          value={newChannel}
          onChange={(e) => setNewChannel(e.target.value)}
        />

        <button
          className="
            absolute right-3 top-1/2 -translate-y-1/2
            w-8 h-8 rounded-lg flex items-center justify-center
            text-white text-xl font-bold
            `bg-gradient-to-r from-blue-600 to-blue-500
            hover:from-blue-500 hover:to-blue-400
            shadow-[0_0_12px_rgba(0,0,255,0.5)]
            transition-all duration-300
          "
          onClick={handleCreateChannel}
        >
          +
        </button>
      </div>

      {/* CHANNEL LIST */}
      <div className="flex flex-col gap-3 mb-10">
        {channels.map((ch) => (
          <div
            key={ch._id}
            className={`
              p-3 flex items-center justify-between rounded-2xl
              transition-all duration-300 border border-white/10
              shadow-[0_4px_10px_rgba(0,0,0,0.4)]
              backdrop-blur-sm cursor-pointer group
              ${
                selectedChannel === ch._id
                  ? "`bg-gradient-to-r from-blue-600 to-blue-500 shadow-[0_4px_25px_rgba(0,0,255,0.4)] scale-[1.03]"
                  : "bg-white/5 hover:bg-white/10 hover:scale-[1.02]"
              }
            `}
          >
            {/* LEFT SIDE */}
            <div
              className="flex items-center gap-3"
              onClick={() => handleJoinChannel(ch._id)}
            >
              <div
                className="
                w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                bg-gradient-to-br from-white/20 to-white/10
                backdrop-blur-xl relative
                shadow-[0_5px_15px_rgba(0,0,0,0.4)]
              "
              >
                <div
                  className="
                  absolute inset-0 rounded-2xl
                  bg-white/10 opacity-40 pointer-events-none
                "
                ></div>

                {getEmoji(ch.name)}
              </div>

              <span className="text-white font-semibold text-lg tracking-wide">
                #{ch.name}
              </span>
            </div>

            {/* RIGHT SIDE → EDIT + DELETE */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
              <button
                className="text-yellow-400 text-xl hover:scale-110"
                onClick={() => {
                  setEditChannel(ch);
                  setRenameValue(ch.name);
                }}
              >
                ✏️
              </button>

              <button
                className="text-red-400 text-xl hover:scale-110"
                onClick={() => setDeleteConfirm(ch)}
              >
                ❌
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ONLINE USERS */}
      <h3 className="text-xl text-white/90 font-semibold mb-3">
        Online Users
      </h3>

      <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
        {onlineUsers.filter((u) => u.isOnline).length > 0 ? (
          onlineUsers
            .filter((u) => u.isOnline)
            .map((u) => (
              <div
                key={u._id}
                className="
                  p-3 flex items-center gap-3
                  bg-white/10 rounded-2xl backdrop-blur-md border border-white/20
                  hover:bg-white/20 hover:scale-[1.02]
                  transition-all duration-300
                  shadow-[0_8px_20px_rgba(255,255,255,0.06)]
                "
              >
                <div
                  className="
                    w-10 h-10 rounded-full
                    bg-gradient-to-br from-purple-500 to-blue-400
                    flex items-center justify-center text-white font-bold text-sm
                  "
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>

                <div className="flex flex-col">
                  <span className="text-white font-medium">
                    {u.username}
                  </span>

                  <span className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
            ))
        ) : (
          <p className="text-gray-400 text-sm">No users online</p>
        )}
      </div>

      {/* LOGOUT */}
      <button
        className="
          mt-6 py-3 rounded-xl
          bg-gradient-to-r from-red-700 to-red-600
          hover:from-red-600 hover:to-red-500
          text-white font-bold text-lg
          shadow-[0_4px_20px_rgba(255,0,0,0.4)]
          transition-all duration-300
        "
        onClick={logout}
      >
        Logout
      </button>

      {/* ✏️ RENAME MODAL */}
      {editChannel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#101425] p-6 rounded-xl w-80 border border-white/20">
            <h2 className="text-white text-xl mb-4">Rename Channel</h2>

            <input
              className="w-full p-2 mb-4 bg-white/10 text-white rounded-lg outline-none"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                className="flex-1 p-2 bg-blue-600 text-white rounded-lg"
                onClick={handleRenameChannel}
              >
                Save
              </button>
              <button
                className="flex-1 p-2 bg-gray-600 text-white rounded-lg"
                onClick={() => setEditChannel(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ❌ DELETE MODAL */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-[#101425] p-6 rounded-xl w-80 border border-white/20">
            <h2 className="text-white text-xl mb-4">
              Delete #{deleteConfirm.name}?
            </h2>

            <p className="text-gray-300 mb-4">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 p-2 bg-red-600 text-white rounded-lg"
                onClick={handleDeleteChannel}
              >
                Delete
              </button>
              <button
                className="flex-1 p-2 bg-gray-600 text-white rounded-lg"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
