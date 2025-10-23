// vite-project/src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css";

// Connect to Socket.io server using environment variable
const CHAT_URL = import.meta.env.VITE_CHAT_URL || "http://localhost:4000";

// Get auth token from cookie or localStorage
const getAuthToken = () => {
  // Try to get from cookie
  const cookies = document.cookie.split(';');
  const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
  if (tokenCookie) {
    return tokenCookie.split('=')[1];
  }
  // Fallback to localStorage if needed
  return localStorage.getItem('auth_token');
};

// Initialize socket with authentication
const socket = io(CHAT_URL, {
  auth: {
    token: getAuthToken()
  },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default function Chat({ teamId: initialTeamId, senderEmail }) {
  // ---------------- STATE ----------------
  const [teamId, setTeamId] = useState(initialTeamId); // Which team we're in
  const [channelId, setChannelId] = useState("general"); // Active channel
  const [channels] = useState(["Frontend", "Backend", "Security", "announcements", "random"]);
  const [messages, setMessages] = useState([]); // Chat messages for current channel
  const [newMessage, setNewMessage] = useState(""); // Message input text
  const [file, setFile] = useState(null); // File selected for upload
  const [users, setUsers] = useState([]); // Users in the current channel

  const messagesEndRef = useRef(null); // Scroll-to-bottom reference

  // ---------------- EFFECT: Scroll to bottom ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- EFFECT: Join socket room when channel/team changes ----------------
  useEffect(() => {
    if (!teamId || !channelId) return;

    // Join the selected room
    socket.emit("joinRoom", { teamId, channelId });

    // Listen for message history
    socket.off("messageHistory").on("messageHistory", (history) => {
      setMessages(history);
    });

    // Listen for new incoming messages
    socket.off("newMessage").on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen for user list updates for this channel
    socket.off("channelUsers").on("channelUsers", (userList) => {
      setUsers(userList);
    });

    // Request updated user list when switching channels
    socket.emit("getChannelUsers", { teamId, channelId });

  }, [teamId, channelId]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = () => {
    if (!newMessage.trim() && !file) return; // Prevent sending empty

    socket.emit("sendMessage", {
      teamId,
      channelId,
      senderEmail,
      content: newMessage.trim(),
      fileName: file ? file.name : null,
    });

    setNewMessage(""); // Clear input
    setFile(null); // Clear file
  };

  // ---------------- HANDLE FILE SELECT ----------------
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // ---------------- FORMATTERS ----------------
  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDateSeparator = (ts) => {
    const today = new Date();
    const msgDate = new Date(ts);
    const diffDays = Math.floor(
      (today.setHours(0, 0, 0, 0) - msgDate.setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return msgDate.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ---------------- MESSAGE GROUPING LOGIC ----------------
  const shouldShowAvatar = (msg, prevMsg) => {
    if (!prevMsg) return true;
    const sameUser = msg.senderEmail === prevMsg.senderEmail;
    const sameDay =
      new Date(msg.timestamp).toDateString() ===
      new Date(prevMsg.timestamp).toDateString();
    const within5Min =
      Math.abs(new Date(msg.timestamp) - new Date(prevMsg.timestamp)) <
      5 * 60 * 1000;
    return !(sameUser && sameDay && within5Min);
  };

  return (
    <div className="chat-container">
      {/* ---------- LEFT SIDEBAR: Channels ---------- */}
      <div className="chat-sidebar">
        <h3 className="sidebar-header">Channels</h3>

        <div className="channel-list">
          {channels.map((ch) => (
            <div
              key={ch}
              className={`channel-item ${channelId === ch ? "active" : ""}`}
              onClick={() => setChannelId(ch)}
            >
              # {ch}
            </div>
          ))}
        </div>

        {/* Sticks to bottom of sidebar */}
        <div className="user-container"> 
          <button
            className="user-btn" 
            onClick={() => alert("Add member functionality coming soon!")}
          >
            Users
          </button>
        </div>
      </div>

      {/* ---------- MAIN CHAT AREA ---------- */}
      <div className="chat-main">
        {/* Channel Header */}
        <div className="chat-header">
          <h2>#{channelId}</h2>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, idx) => {
            const prevMsg = idx > 0 ? messages[idx - 1] : null;
            const showAvatar = shouldShowAvatar(msg, prevMsg);

            // Show date separator if it's the first message of the day
            let showDateSeparator = false;
            if (
              idx === 0 ||
              new Date(msg.timestamp).toDateString() !==
              new Date(prevMsg?.timestamp).toDateString()
            ) {
              showDateSeparator = true;
            }

            return (
              <React.Fragment key={idx}>
                {showDateSeparator && (
                  <div className="date-separator">
                    <span>{formatDateSeparator(msg.timestamp)}</span>
                  </div>
                )}

                <div
                  className={`chat-message ${
                    msg.senderEmail === senderEmail ? "own-message" : ""
                  } ${showAvatar ? "with-avatar" : "grouped"}`}
                >
                  {showAvatar && (
                    <div className="avatar">
                      {msg.senderName
                        ? msg.senderName.charAt(0).toUpperCase()
                        : msg.senderEmail.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="message-content">
                    {showAvatar && (
                      <div className="message-meta">
                        <span className="sender">{msg.senderName}</span>
                        <span className="time">{formatTime(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className="text">{msg.content}</div>
                    {msg.fileName && (
                      <div className="file-attachment">
                        📎 {msg.fileName}
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${channelId}`}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <input
            type="file"
            id="file-upload"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="upload-btn"
            onClick={() => document.getElementById("file-upload").click()}
          >
            📎
          </button>
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* ---------- RIGHT SIDEBAR: Users in this channel ---------- */}
      <div className="chat-users">
        <h3 className="sidebar-header">Users</h3>
        <div className="user-list">
          {users.map((user) => (
            <div key={user.id} className="user-item">
              <span
                className={`status-dot ${user.online ? "online" : "offline"}`}
              ></span>
              {user.name}
            </div>
          ))}
        </div>

        {/* Add Member Button */}
        <div className="add-member-container">
          <button
            className="add-member-btn"
            onClick={() => alert("Add member functionality coming soon!")}
          >
            ➕ Add Member
          </button>
        </div>
      </div>
    </div>
  );
}
