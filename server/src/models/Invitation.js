import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['student', 'user', 'team_lead', 'manager', 'admin'],
      default: 'user',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
invitationSchema.index({ email: 1 });
invitationSchema.index({ status: 1 });
// token already has unique: true, no need for explicit index
invitationSchema.index({ expiresAt: 1 });

// Auto-expire invitations
invitationSchema.pre('save', function (next) {
  if (this.expiresAt < new Date() && this.status === 'pending') {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model('Invitation', invitationSchema);
