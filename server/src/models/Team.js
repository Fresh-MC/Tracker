/**
 * Team Model - MongoDB schema for teams
 * 
 * Features:
 * - Team name and description
 * - Members array (references to User model)
 * - Project assignment
 * - Timestamps and metadata
 */

import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
teamSchema.index({ name: 1 });
teamSchema.index({ members: 1 });

const Team = mongoose.model('Team', teamSchema);

export default Team;
