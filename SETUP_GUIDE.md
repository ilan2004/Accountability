# 🤝 Accountability Partners Setup Guide

This guide will help you set up the complete accountability partner system with Firebase real-time sync and WhatsApp notifications.

## 🚀 Quick Start Overview

1. **Firebase Setup** - Real-time database and authentication
2. **Next.js App** - Beautiful accountability partner interface
3. **WhatsApp Service** - Automated notifications for task completions

---

## 📋 Prerequisites

- Node.js 18+ installed
- Google account for Firebase
- WhatsApp account for notifications
- Chrome browser (for WhatsApp Web automation)

---

## 🔥 Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `accountability-partners`
4. Enable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable **Google** provider
5. Add your domain to authorized domains (e.g., `localhost`, your deployment URL)

### 1.3 Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Test mode** (for now)
4. Select a location close to you
5. Click "Done"

### 1.4 Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app with name: "Accountability Partners"
5. Copy the `firebaseConfig` object

---

## 🔧 Step 2: Environment Configuration

### 2.1 Create Environment File

1. Copy `.env.local.template` to `.env.local`:
   ```bash
   cp .env.local.template .env.local
   ```

2. Fill in your Firebase configuration in `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   WHATSAPP_API_URL=http://localhost:3001
   WHATSAPP_SESSION_NAME=accountability-partner
   ```

---

## 📱 Step 3: Next.js App Setup

### 3.1 Install Dependencies

```bash
npm install
```

### 3.2 Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 3.3 Test Firebase Connection

1. Open the app in your browser
2. Click "Sign in with Google"
3. Complete Google authentication
4. You should see the accountability partner dashboard

---

## 💬 Step 4: WhatsApp Service Setup

### 4.1 Install WhatsApp Service Dependencies

```bash
cd whatsapp-service
npm install
```

### 4.2 Start WhatsApp Service

```bash
npm run dev
```

### 4.3 Link WhatsApp Account

1. The service will show a QR code in the terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code with your phone
5. Wait for "WhatsApp Client is ready!" message

### 4.4 Test WhatsApp Integration

Test the WhatsApp service:
```bash
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{"number": "+1234567890"}'
```

Replace `+1234567890` with your actual phone number.

---

## 👥 Step 5: Partner Setup

### 5.1 Connect with Your Partner

1. Both you and your partner need to:
   - Sign up using Google authentication
   - Enter each other's email addresses
   - Add WhatsApp numbers (optional)

2. Click "Connect Partner" to link your accounts

### 5.2 Start Using the System

1. **Add Tasks**: Click "Add Quest" to create daily tasks
2. **Complete Tasks**: Check off tasks as you complete them
3. **Get Notifications**: Your partner receives WhatsApp notifications when you complete tasks
4. **View Progress**: See your partner's completed tasks in real-time

---

## 🎨 Features

### ✨ Beautiful UI
- Custom mint/green color scheme
- Tanker font for headings
- Smooth animations and hover effects
- Responsive design for all devices

### 🔄 Real-time Sync
- Tasks sync instantly between partners
- Live updates when tasks are completed
- Persistent progress tracking

### 📱 WhatsApp Notifications
- Automatic messages when tasks are completed
- Customizable message templates
- Support for international phone numbers

### 🏆 Gamification
- Points system for completed tasks
- Daily streaks for motivation
- Progress bars and visual feedback

---

## 🔧 Configuration Options

### Phone Number Format

The WhatsApp service expects numbers in international format. Update the country code in `whatsapp-service/server.js`:

```javascript
// Change line 81 for your country (currently set to +91 for India)
if (formattedNumber.length === 10) {
    formattedNumber = '91' + formattedNumber; // Change '91' to your country code
}
```

### Message Templates

Customize notification messages in `src/app/api/whatsapp-notify/route.ts`:

```javascript
case 'task_completed':
    message = `🎉 Your custom message here! ${userName} completed: ${taskTitle}`;
    break;
```

---

## 🚀 Deployment

### Deploy Next.js App

1. **Vercel (Recommended)**:
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**:
   ```bash
   npm run build
   # Upload dist folder to Netlify
   ```

### Deploy WhatsApp Service

1. **Railway**:
   - Connect GitHub repo
   - Set environment variables
   - Deploy automatically

2. **Heroku**:
   ```bash
   git subtree push --prefix whatsapp-service heroku main
   ```

---

## 🐛 Troubleshooting

### Firebase Issues

**Error: "Firebase config missing"**
- Check that all Firebase environment variables are set in `.env.local`
- Verify Firebase project settings

**Error: "Permission denied"**
- Update Firestore rules to allow authenticated users
- Check authentication is working

### WhatsApp Issues

**Error: "WhatsApp client not ready"**
- Make sure you scanned the QR code
- Wait for "WhatsApp Client is ready!" message
- Restart the WhatsApp service if needed

**Messages not sending**
- Check phone number format
- Verify WhatsApp service is running on port 3001
- Test with `/test-message` endpoint

### General Issues

**App not loading**
- Check console for error messages
- Verify all dependencies are installed
- Make sure both services are running

---

## 🔒 Security Notes

⚠️ **Important Security Considerations:**

1. **WhatsApp Terms**: WhatsApp Web automation is against their Terms of Service. Use at your own risk.

2. **Firebase Rules**: Update Firestore security rules for production:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /tasks/{taskId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

3. **Environment Variables**: Never commit `.env.local` to version control.

---

## 🤝 Support

If you run into issues:

1. Check the troubleshooting section above
2. Review console logs for error messages
3. Test each component individually
4. Verify all services are running

---

## 🎉 You're All Set!

Your accountability partner system is ready! Start adding tasks and motivating each other to achieve your goals! 💪

**Pro Tips:**
- Set up regular check-ins with your partner
- Create meaningful, specific tasks
- Celebrate completions together
- Use the points system for friendly competition
