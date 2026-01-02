# Clerk Authentication Setup

This application now uses Clerk for authentication instead of the custom authentication system.

## Setup Instructions

### 1. Create a Clerk Account
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign up for a new account or log in
3. Create a new application

### 2. Get Your Publishable Key
1. In your Clerk dashboard, select your application
2. Go to the **API Keys** section
3. Copy the **Publishable Key** (starts with `pk_test_` or `pk_live_`)

### 3. Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and replace the placeholder with your actual Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your-actual-key-here
   ```

### 4. Restart the Development Server
```bash
npm run dev
```

## How It Works

### Authentication Flow
1. **Login Page**: Uses Clerk's `SignIn` component for authentication
2. **Register Page**: Uses Clerk's `SignUp` component for user registration
3. **Admin Dashboard**: Protected by Clerk authentication + admin role check
4. **Automatic Redirect**: After successful login/registration, users are redirected to `/admin`

### Admin Role Detection
The system determines admin status based on:
- User's public metadata having `role: "admin"`
- OR user's email containing "admin" (for testing purposes)

### Protected Routes
All admin routes (`/admin/*`) are protected and require:
- User to be authenticated via Clerk
- User to have admin privileges

### Features Removed
- Custom authentication API endpoints
- Manual token management
- Custom user state management
- Old AuthContext and related files

### Features Added
- Clerk authentication components
- ClerkAuthProvider context
- Admin role checking
- Automatic redirects after authentication
- Styled Clerk components to match existing design

## Testing

1. Start the development server
2. Navigate to `/login` or `/register`
3. Create a new account or sign in
4. You should be automatically redirected to the admin dashboard
5. Try accessing admin routes while logged out - you should be redirected to login

## Styling

Clerk components have been styled to match the existing design:
- Consistent colors and spacing
- Responsive design
- Hover states and transitions
- Error and success message styling

## Troubleshooting

### "Missing Publishable Key" Error
Make sure you've created a `.env` file with the correct `VITE_CLERK_PUBLISHABLE_KEY`.

### Admin Access Not Working
- Check that your user has admin role in Clerk's metadata
- Or ensure your email contains "admin" for testing

### Styling Issues
Make sure `ClerkStyles.css` is imported in both login and register pages.
