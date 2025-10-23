# GitHub OAuth Setup Guide

This guide will help you set up GitHub OAuth authentication for your Tracker KPR application.

## 📋 Overview

GitHub OAuth has been integrated into your MERN stack application with the following features:

- ✅ Secure OAuth 2.0 authentication via GitHub
- ✅ Automatic user creation with default `user` role
- ✅ JWT token generation after successful login
- ✅ Role-Based Access Control (RBAC) preserved
- ✅ GitHub avatar and profile display
- ✅ Seamless integration with existing email/password auth

## 🔧 Setup Steps

### 1. Register Your GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"** or **"Register a new application"**
3. Fill in the application details:

```
Application name: Tracker KPR (or your preferred name)
Homepage URL: http://localhost:5174
Application description: Project tracker with role-based access control
Authorization callback URL: http://localhost:3000/api/auth/github/callback
```

4. Click **"Register application"**
5. You'll be redirected to your app's settings page
6. Copy the **Client ID**
7. Click **"Generate a new client secret"** and copy the secret immediately (you won't be able to see it again!)

### 2. Update Environment Variables

Open `/server/.env` and update the following variables:

```env
# ============================================
# GITHUB OAUTH CONFIGURATION
# ============================================
GITHUB_CLIENT_ID=your_actual_client_id_here
GITHUB_CLIENT_SECRET=your_actual_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

# ============================================
# SESSION CONFIGURATION
# ============================================
SESSION_SECRET=your_session_secret_here

# ============================================
# FRONTEND CONFIGURATION
# ============================================
FRONTEND_URL=http://localhost:5174
```

**⚠️ Important:** 
- Never commit your `.env` file to version control
- Keep your CLIENT_SECRET secure
- Generate a strong SESSION_SECRET: `openssl rand -base64 32`

### 3. Start the Application

#### Backend (Terminal 1):
```bash
cd server
npm install  # If not already done
npm run dev
```

The server should start on `http://localhost:3000`

#### Frontend (Terminal 2):
```bash
cd frontend
npm install  # If not already done
npm run dev
```

The frontend should start on `http://localhost:5174`

### 4. Test GitHub OAuth Login

1. Navigate to `http://localhost:5174`
2. You'll see the animated login page with two options:
   - Traditional email/password login
   - **"Sign in with GitHub"** button
3. Click the GitHub button
4. You'll be redirected to GitHub to authorize the app
5. After authorization, you'll be redirected back to your app's dashboard
6. Your GitHub profile picture and name will appear in the navbar

## 📊 How It Works

### Backend Flow

1. **User clicks "Sign in with GitHub"** → Redirects to `/api/auth/github`
2. **Passport GitHub Strategy** → Redirects to GitHub OAuth page
3. **User authorizes** → GitHub redirects to `/api/auth/github/callback`
4. **Passport processes callback:**
   - Checks if user exists by `githubId`
   - If not, creates new user with default `user` role
   - If exists, updates `name`, `avatar`, and `lastLogin`
5. **JWT token generated** → Includes `id`, `role`, `email`, `username`
6. **Redirect to frontend** → `http://localhost:5174/auth/callback?token=...`

### Frontend Flow

1. **AuthCallback component** → Captures token from URL params
2. **Decode JWT** → Extract user data (`id`, `role`, `email`, `username`)
3. **Store in localStorage** → Persist session
4. **Update AuthContext** → Make user data available globally
5. **Redirect to dashboard** → User is now authenticated

## 🔐 Security Features

- ✅ JWT tokens with 7-day expiration
- ✅ httpOnly session cookies
- ✅ CORS configured for frontend domain only
- ✅ Password field optional for GitHub users
- ✅ RBAC enforced on all protected routes
- ✅ Session secret for secure cookie signing

## 👥 User Roles

New GitHub users are created with the default `user` role. To change a user's role:

1. Use MongoDB Compass or mongo shell
2. Find the user by email or githubId
3. Update the `role` field to one of:
   - `user` (default)
   - `team_lead`
   - `manager`
   - `admin`

Example with mongo shell:
```javascript
db.users.updateOne(
  { email: "yourname@example.com" },
  { $set: { role: "manager" } }
)
```

## 🧪 Testing Checklist

- [ ] GitHub OAuth app registered with correct callback URL
- [ ] Environment variables configured in `/server/.env`
- [ ] Backend server running on port 3000
- [ ] Frontend server running on port 5174
- [ ] Click "Sign in with GitHub" button
- [ ] Redirected to GitHub authorization page
- [ ] After authorization, redirected back to dashboard
- [ ] GitHub avatar displayed in navbar
- [ ] Username/name displayed correctly
- [ ] GitHub icon badge shown next to username
- [ ] Protected routes still work (e.g., `/project-plan`)
- [ ] Role-based routes respect RBAC (e.g., `/team` for managers only)
- [ ] Logout functionality works
- [ ] Login with multiple GitHub accounts creates separate users

## 🐛 Troubleshooting

### "Redirect URI mismatch" error
- Ensure the callback URL in GitHub app settings matches exactly: `http://localhost:3000/api/auth/github/callback`
- Check that `GITHUB_CALLBACK_URL` in `.env` matches

### "Application not authorized" error
- Verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are correct
- Regenerate client secret if needed

### "Token generation failed" error
- Check `JWT_SECRET` is set in `.env`
- Verify `SESSION_SECRET` is configured

### Redirected to login page after GitHub auth
- Check browser console for errors
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Ensure jwt-decode package is installed: `npm install jwt-decode`

### Avatar not showing
- Check user object in AuthContext has `avatar` or `profilePicture` field
- Verify GitHub profile has a public profile picture

## 📁 Files Modified

### Backend:
- ✅ `server/src/models/User.js` - Added `githubId`, `name`, `avatar`, `authProvider` fields
- ✅ `server/src/config/passport.js` - Passport GitHub strategy configuration
- ✅ `server/src/routes/githubAuthRoutes.js` - OAuth routes (`/github`, `/github/callback`, `/logout`)
- ✅ `server/src/server.js` - Passport initialization and session middleware
- ✅ `server/.env` - GitHub OAuth credentials

### Frontend:
- ✅ `frontend/src/pages/AnimatedLogin.jsx` - Added "Sign in with GitHub" button
- ✅ `frontend/src/pages/AuthCallback.jsx` - OAuth callback handler
- ✅ `frontend/src/App.jsx` - Added `/auth/callback` route
- ✅ `frontend/src/components/Navbar.jsx` - Display GitHub avatar and badge
- ✅ `frontend/package.json` - Added `jwt-decode` dependency

## 🚀 Production Deployment

When deploying to production:

1. Update GitHub OAuth app with production URLs:
   ```
   Homepage URL: https://yourdomain.com
   Authorization callback URL: https://api.yourdomain.com/api/auth/github/callback
   ```

2. Update environment variables:
   ```env
   GITHUB_CALLBACK_URL=https://api.yourdomain.com/api/auth/github/callback
   FRONTEND_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. Ensure HTTPS is enabled (GitHub OAuth requires secure connections in production)

## 🎉 Success!

You now have a fully functional GitHub OAuth authentication system integrated with your MERN stack application. Users can log in with either:
- Email/password (traditional)
- GitHub OAuth (social login)

Both methods generate JWT tokens and work seamlessly with your existing RBAC system!

## 📞 Need Help?

- Review the code comments in the modified files
- Check the browser console for error messages
- Verify all environment variables are set correctly
- Ensure MongoDB is running and connected

Happy coding! 🚀
