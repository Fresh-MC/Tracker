// models/Task.js
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },

  assignee:    { type: String }, // Could also be ObjectId reference to User
  priority:    { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },

  startDate:   { type: String }, // optional, stored as string for now
  endDate:     { type: String },
  status:      { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },

  subtasks:    [{ type: String }],

  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", taskSchema, "task");
