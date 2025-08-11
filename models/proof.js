const mongoose = require("mongoose");
const proofSchema = new mongoose.Schema({
  taskId: String,
  filename: String,
  originalname: String,
  path: String,
  uploadedBy: String, // or userId
  uploadedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model("Proof", proofSchema);