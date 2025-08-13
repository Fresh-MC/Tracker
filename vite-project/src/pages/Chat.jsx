// vite-project/src/pages/Chat.jsx
import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./Chat.css";

// Crypto utilities
import CryptoJS from "crypto-js";

// Connect to Socket.io server
const socket = io("http://localhost:4000");

export default function Chat({ teamId: initialTeamId, senderEmail }) {
  // ---------------- STATE ----------------
  const [teamId, setTeamId] = useState(initialTeamId);
  const [channelId, setChannelId] = useState("general");
  const [channels] = useState(["Frontend", "Backend", "Security", "announcements", "random"]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [users, setUsers] = useState([]);

  // ---------------- CRYPTO STATE ----------------
  const dhRef = useRef(null); // Client Diffie-Hellman instance
  const sharedSecretsRef = useRef({}); // Shared AES keys per peer

  const messagesEndRef = useRef(null);

  // ---------------- EFFECT: Scroll ----------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------- UTIL: AES Encrypt ----------------
  const encryptMessage = (msg, key) => {
    return CryptoJS.AES.encrypt(msg, key).toString();
  };

  // ---------------- UTIL: AES Decrypt ----------------
  const decryptMessage = (ciphertext, key) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return ciphertext;
    }
  };

  // ---------------- EFFECT: Join room + DH ----------------
  useEffect(() => {
    if (!teamId || !channelId) return;

    // Generate DH key pair on client
    dhRef.current = window.crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    ).then((keyPair) => {
      return keyPair;
    });

    dhRef.current.then((keyPair) => {
      // Export public key
      window.crypto.subtle.exportKey("raw", keyPair.publicKey)
        .then((pubKeyBuffer) => {
          const clientPublicKey = btoa(String.fromCharCode(...new Uint8Array(pubKeyBuffer)));

          // Emit joinRoom with client public key
          socket.emit("joinRoom", { teamId, channelId, clientPublicKey });
        });
    });

    // Listen for server message history
    socket.off("messageHistory").on("messageHistory", (history) => {
      // Decrypt messages if needed
      setMessages(history.map(msg => {
        if (msg.contentEncrypted && sharedSecretsRef.current[msg.senderEmail]) {
          msg.content = decryptMessage(msg.content, sharedSecretsRef.current[msg.senderEmail]);
        }
        return msg;
      }));
    });

    // Listen for new messages
    socket.off("newMessage").on("newMessage", (msg) => {
      // Decrypt if shared key exists
      if (msg.contentEncrypted && sharedSecretsRef.current[msg.senderEmail]) {
        msg.content = decryptMessage(msg.content, sharedSecretsRef.current[msg.senderEmail]);
      }
      setMessages(prev => [...prev, msg]);
    });

    // Listen for new peers and server public key
    socket.off("newPeer").on("newPeer", ({ socketId, publicKey }) => {
      // Derive shared AES key
      dhRef.current.then(async keyPair => {
        const serverPubKey = Uint8Array.from(atob(publicKey), c => c.charCodeAt(0));
        const sharedKey = await window.crypto.subtle.deriveBits(
          { name: "ECDH", public: await window.crypto.subtle.importKey("raw", serverPubKey, { name: "ECDH", namedCurve: "P-256" }, false, [] ) },
          keyPair.privateKey,
          256
        );
        const hexKey = Array.from(new Uint8Array(sharedKey)).map(b => b.toString(16).padStart(2, "0")).join("");
        sharedSecretsRef.current[socketId] = hexKey;
      });
    });

    // Request channel users
    socket.emit("getChannelUsers", { teamId, channelId });

  }, [teamId, channelId]);

  // ---------------- SEND MESSAGE ----------------
  const sendMessage = () => {
    if (!newMessage.trim() && !file) return;

    // Encrypt message for all peers (simplified: using first shared key)
    let encryptedContent = newMessage.trim();
    const firstKey = Object.values(sharedSecretsRef.current)[0];
    if (firstKey) encryptedContent = encryptMessage(newMessage.trim(), firstKey);

    socket.emit("sendMessage", {
      teamId,
      channelId,
      senderEmail,
      content: encryptedContent,
      contentEncrypted: !!firstKey,
      fileName: file ? file.name : null
    });

    setNewMessage("");
    setFile(null);
  };

  // ---------------- HANDLE FILE ----------------
  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  // ---------------- FORMATTERS ----------------
  const formatTime = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDateSeparator = ts => {
    const today = new Date();
    const msgDate = new Date(ts);
    const diffDays = Math.floor((today.setHours(0,0,0,0)-msgDate.setHours(0,0,0,0))/(1000*60*60*24));
    if(diffDays===0) return "Today";
    if(diffDays===1) return "Yesterday";
    return msgDate.toLocaleDateString([], { month:"short", day:"numeric", year:"numeric" });
  };

  const shouldShowAvatar = (msg, prevMsg) => {
    if(!prevMsg) return true;
    const sameUser = msg.senderEmail===prevMsg.senderEmail;
    const sameDay = new Date(msg.timestamp).toDateString()===new Date(prevMsg.timestamp).toDateString();
    const within5Min = Math.abs(new Date(msg.timestamp)-new Date(prevMsg.timestamp)) < 5*60*1000;
    return !(sameUser && sameDay && within5Min);
  };

  // ---------------- RENDER ----------------
  return (
    <div className="chat-container">
      {/* LEFT SIDEBAR */}
      <div className="chat-sidebar">
        <h3 className="sidebar-header">Channels</h3>
        <div className="channel-list">
          {channels.map(ch=>(
            <div key={ch} className={`channel-item ${channelId===ch?"active":""}`} onClick={()=>setChannelId(ch)}># {ch}</div>
          ))}
        </div>
        <div className="user-container">
          <button className="user-btn" onClick={()=>alert("Add member functionality coming soon!")}>Users</button>
        </div>
      </div>

      {/* MAIN CHAT */}
      <div className="chat-main">
        <div className="chat-header"><h2>#{channelId}</h2></div>
        <div className="chat-messages">
          {messages.map((msg, idx)=>{
            const prevMsg = idx>0 ? messages[idx-1]:null;
            const showAvatar = shouldShowAvatar(msg, prevMsg);
            let showDateSeparator=false;
            if(idx===0 || new Date(msg.timestamp).toDateString()!==new Date(prevMsg?.timestamp).toDateString()) showDateSeparator=true;

            return <React.Fragment key={idx}>
              {showDateSeparator && <div className="date-separator"><span>{formatDateSeparator(msg.timestamp)}</span></div>}
              <div className={`chat-message ${msg.senderEmail===senderEmail?"own-message":""} ${showAvatar?"with-avatar":"grouped"}`}>
                {showAvatar && <div className="avatar">{msg.senderName?msg.senderName.charAt(0).toUpperCase():msg.senderEmail.charAt(0).toUpperCase()}</div>}
                <div className="message-content">
                  {showAvatar && <div className="message-meta"><span className="sender">{msg.senderName}</span><span className="time">{formatTime(msg.timestamp)}</span></div>}
                  <div className="text">{msg.content}</div>
                  {msg.fileName && <div className="file-attachment">📎 {msg.fileName}</div>}
                </div>
              </div>
            </React.Fragment>;
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="chat-input">
          <input type="text" value={newMessage} onChange={e=>setNewMessage(e.target.value)} placeholder={`Message #${channelId}`} onKeyDown={e=>e.key==="Enter" && sendMessage()} />
          <input type="file" id="file-upload" style={{display:"none"}} onChange={handleFileChange}/>
          <button className="upload-btn" onClick={()=>document.getElementById("file-upload").click()}>📎</button>
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="chat-users">
        <h3 className="sidebar-header">Users</h3>
        <div className="user-list">{users.map(u=><div key={u.id} className="user-item"><span className={`status-dot ${u.online?"online":"offline"}`}></span>{u.name}</div>)}</div>
        <div className="add-member-container">
          <button className="add-member-btn" onClick={()=>alert("Add member functionality coming soon!")}>➕ Add Member</button>
        </div>
      </div>
    </div>
  );
}
