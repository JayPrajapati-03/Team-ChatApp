import { useContext, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { AuthContext } from "../context/AuthContext";
import { MessageSquare, Sparkles } from "lucide-react";

const Home = () => {
  const { user } = useContext(AuthContext);
  const [selectedChannel, setSelectedChannel] = useState(null);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <Sidebar
        selectedChannel={selectedChannel}
        onSelectChannel={setSelectedChannel}
      />

      <div className="flex-1 relative z-10">
        {selectedChannel ? (
          <ChatWindow
            channelId={selectedChannel}
            currentUser={user}
            onBack={() => setSelectedChannel(null)}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 shadow-2xl text-center max-w-md mx-4">
              <div className="relative mb-6">
                <MessageSquare className="h-20 w-20 text-purple-400 mx-auto mb-4 animate-bounce" />
                <Sparkles className="h-6 w-6 text-yellow-400 absolute -top-2 -right-2 animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Welcome to Team Chat</h2>
              <p className="text-gray-300 text-lg mb-6">Select a channel from the sidebar to start chatting</p>
              <div className="flex justify-center space-x-2">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse animation-delay-1000"></div>
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse animation-delay-2000"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
