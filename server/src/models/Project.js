/**
 * Project Model - MongoDB schema for projects
 * 
 * Features:
 * - Project name and description
 * - Modules (tasks/milestones)
 * - Status tracking
 * - Team assignment
 */

import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'blocked'],
    default: 'not-started'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  modules: [moduleSchema],
  status: {
    type: String,
    enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
    default: 'planning'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
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
projectSchema.index({ name: 1 });
projectSchema.index({ teamId: 1 });
projectSchema.index({ status: 1 });

const Project = mongoose.model('Project', projectSchema);

export default Project;
