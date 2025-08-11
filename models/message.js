const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  teamId: { type: String, required: true },
  channelId: { type: String, required: true },
  senderEmail: { type: String, required: true },
  senderName: { type: String, required: true }, // fetched from username
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
