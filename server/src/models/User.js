import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: function() {
      // Password is required only if not using GitHub auth
      return !this.githubId;
    },
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  // GitHub OAuth fields
  githubId: {
    type: String,
    unique: true,
    sparse: true // Allow null values but unique if present
  },
  githubUsername: {
    type: String,
    sparse: true
  },
  githubToken: {
    type: String,
    select: false // Never include in queries by default (sensitive)
  },
  githubStats: {
    repos: { type: Number, default: 0 },
    commits: { type: Number, default: 0 },
    pullRequests: { type: Number, default: 0 },
    issues: { type: Number, default: 0 },
    stars: { type: Number, default: 0 }
  },
  lastSync: {
    type: Date,
    default: null
  },
  name: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  authProvider: {
    type: String,
    enum: ['local', 'github'],
    default: 'local'
  },
  role: {
    type: String,
    enum: ['student', 'user', 'team_lead', 'manager', 'admin'],
    default: 'user'
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public user data (no password, no token)
userSchema.methods.toPublicJSON = function() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    name: this.name,
    role: this.role,
    profilePicture: this.profilePicture,
    avatar: this.avatar,
    authProvider: this.authProvider,
    githubUsername: this.githubUsername,
    githubStats: this.githubStats,
    lastSync: this.lastSync,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

export default User;
