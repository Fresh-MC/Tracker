const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  teamId: String,
  channelId: String,
  senderEmail: String,
  senderName: String,
  content: String,
  contentEncrypted: { type: Boolean, default: false },
  fileName: { type: String, default: null },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", MessageSchema);
