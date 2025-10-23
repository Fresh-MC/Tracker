import mongoose from 'mongoose';

const projectIntegrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    connected: {
      type: Boolean,
      default: false,
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    connectedAt: {
      type: Date,
      default: null,
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
projectIntegrationSchema.index({ name: 1 });
projectIntegrationSchema.index({ connected: 1 });

export default mongoose.model('ProjectIntegration', projectIntegrationSchema);
