import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import crypto from 'crypto';
import User from '../models/User.js';

// Encrypt GitHub token before storing
const encryptToken = (token) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-this', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

// Decrypt GitHub token when needed
export const decryptToken = (encryptedToken) => {
  if (!encryptedToken) return null;
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-this', 'salt', 32);
  const parts = encryptedToken.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const configurePassport = () => {
  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // GitHub Strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/api/auth/github/callback',
        scope: ['user:email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log('📘 GitHub Profile:', JSON.stringify(profile, null, 2));

          // Extract email from profile
          const email = profile.emails?.[0]?.value || `${profile.username}@github.user`;
          
          // Check if user exists by GitHub ID
          let user = await User.findOne({ githubId: profile.id });

          if (!user) {
            // Check if user exists with same email (linking existing account)
            user = await User.findOne({ email });

            if (user) {
              // Link GitHub account to existing user
              user.githubId = profile.id;
              user.githubUsername = profile.username;
              user.githubToken = encryptToken(accessToken);
              user.name = profile.displayName || profile.username;
              user.avatar = profile.photos?.[0]?.value;
              user.authProvider = 'github';
              user.lastLogin = new Date();
              await user.save();
              console.log(`🔗 Linked GitHub account to existing user: ${user.email}`);
            } else {
              // Create new user
              user = await User.create({
                githubId: profile.id,
                username: profile.username || `github_${profile.id}`,
                githubUsername: profile.username,
                githubToken: encryptToken(accessToken),
                name: profile.displayName || profile.username,
                email,
                avatar: profile.photos?.[0]?.value,
                authProvider: 'github',
                role: 'user', // Default role for new GitHub users
                isActive: true,
                lastLogin: new Date()
              });
              console.log(`✅ Created new GitHub user: ${user.email}`);
            }
          } else {
            // Update existing GitHub user's info
            user.githubUsername = profile.username;
            user.githubToken = encryptToken(accessToken);
            user.name = profile.displayName || profile.username;
            user.avatar = profile.photos?.[0]?.value;
            user.lastLogin = new Date();
            await user.save();
            console.log(`🔄 Updated existing GitHub user: ${user.email}`);
          }

          return done(null, user);
        } catch (error) {
          console.error('❌ GitHub Strategy Error:', error);
          return done(error, null);
        }
      }
    )
  );
};

export default configurePassport;
