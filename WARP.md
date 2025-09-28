# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Architecture

This is a **gamified accountability partner system** built with Next.js 15, combining two main applications:

1. **Main Next.js App**: Accountability partner interface with real-time Firebase sync
2. **WhatsApp Service**: Express.js microservice for WhatsApp Web automation

### Core Components Architecture

**TaskFlow**: `AccountabilityPartner` → `GenericQuestBoard` → Firebase → WhatsApp notifications
- `AccountabilityPartner.tsx` handles user auth, partner connections, and task coordination
- `GenericQuestBoard.tsx` is a reusable quest system component with localStorage persistence
- Firebase Firestore stores user profiles, partnerships, and completed tasks
- WhatsApp service sends real-time notifications when partners complete tasks

**State Management Pattern**:
- Firebase Firestore for cross-user real-time sync
- localStorage for local task completion state (daily basis)
- React state for UI reactivity
- Custom storage keys per user: `user_${uid}_points`, `user_${uid}_streak`

## Essential Development Commands

### Main App Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### WhatsApp Service Development
```bash
# Navigate to service
cd whatsapp-service

# Install dependencies
npm install

# Start development (with nodemon)
npm run dev

# Start production
npm run start

# Test WhatsApp integration
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{"number": "+1234567890"}'
```

### Environment Setup
```bash
# Copy environment template (if exists)
cp .env.local.template .env.local

# Required environment variables in .env.local:
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
WHATSAPP_API_URL=http://localhost:3001
```

## Key Architecture Patterns

### Firebase Integration Pattern
- **Authentication**: Google OAuth via Firebase Auth
- **User Profiles**: Stored in `users` collection with partner relationships
- **Tasks**: Stored in `tasks` collection with real-time listeners
- **Real-time Sync**: `onSnapshot` listeners for partner task updates

### GenericQuestBoard Component Design
- **Configurable Quest System**: Accepts custom quests, storage keys, and callbacks
- **Daily State Management**: Uses `YYYY-MM-DD` keys for daily task persistence
- **Points & Streak System**: Automatic calculation with localStorage persistence
- **Extensible**: `onTaskComplete` callback enables external integrations

### WhatsApp Integration Architecture
- **Microservice Pattern**: Separate Express.js app on port 3001
- **WhatsApp Web.js**: Headless browser automation for WhatsApp Web
- **Message Templates**: Structured notification messages in API route
- **Error Handling**: Graceful degradation when WhatsApp service is unavailable

## CSS Architecture

### Custom CSS Variables System
- **Theme Colors**: Defined in `:root` with semantic naming
- **Component-Specific**: Quest board has dedicated CSS classes
- **Mint/Green Theme**: Primary colors are mint (`--color-mint-500`) and dark green (`--color-green-900`)
- **Typography**: Uses Tanker font for headings, loaded via `@font-face`

### Quest Board Styling Pattern
- **3D Effect**: Uses `box-shadow` for elevated card appearance
- **Consistent Borders**: 3px solid borders throughout
- **Smooth Transitions**: 0.3s ease transitions for interactive elements
- **Responsive Design**: Flexbox with proper wrapping and gaps

## Development Patterns

### Task Completion Flow
1. User completes task in `GenericQuestBoard`
2. `onTaskComplete` callback triggered in `AccountabilityPartner`
3. Task saved to Firestore with timestamp and user info
4. WhatsApp notification sent to partner via API route
5. Partner sees real-time update via Firestore listener

### Error Handling Strategy
- **Firebase**: Try-catch blocks with console.error logging
- **WhatsApp**: Graceful degradation - app works without WhatsApp service
- **LocalStorage**: Fallback values and try-catch for storage operations
- **Network**: Check response.ok for API calls

### Security Considerations
- **Firestore Rules**: Currently in test mode - needs production rules
- **WhatsApp ToS**: WhatsApp Web automation violates terms of service
- **Environment Variables**: Never commit Firebase config to repository
- **Phone Numbers**: International format handling in WhatsApp service

## File Structure Significance

### Core App Structure
```
src/app/
├── layout.tsx          # Root layout with font loading
├── page.tsx           # Main route - renders AccountabilityPartner
└── api/whatsapp-notify/ # API route for WhatsApp integration
```

### Component Hierarchy
```
AccountabilityPartner (main coordinator)
└── GenericQuestBoard (reusable quest system)
    ├── Daily quest state management
    ├── Custom quest creation
    ├── Points/streak calculation
    └── Progress visualization
```

### Configuration Files
- `next.config.ts`: Next.js 15 configuration
- `tsconfig.json`: TypeScript strict mode enabled
- `eslint.config.mjs`: Modern ESLint flat config
- `postcss.config.mjs`: Tailwind CSS processing

## Testing Approach

### WhatsApp Service Testing
```bash
# Health check
curl http://localhost:3001/health

# Test message sending
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{"number": "YOUR_PHONE_NUMBER"}'
```

### Firebase Connection Testing
1. Start development server
2. Sign in with Google
3. Check browser console for Firebase connection errors
4. Verify user profile creation in Firestore console

## Common Development Tasks

### Adding New Quest Types
1. Extend `DEFAULT_QUESTS` array in `GenericQuestBoard.tsx`
2. Add new quest with unique `id`, descriptive `title`, and appropriate `points`

### Customizing WhatsApp Messages
1. Edit message templates in `src/app/api/whatsapp-notify/route.ts`
2. Modify the switch statement for different notification types

### Extending Partner Features
1. Add new fields to `UserProfile` interface in `AccountabilityPartner.tsx`
2. Update Firestore user document structure
3. Extend partner connection UI as needed

### Changing Theme Colors
1. Update CSS variables in `src/app/globals.css`
2. Maintain consistent color scheme across components
3. Ensure accessibility compliance for contrast ratios

## Deployment Notes

### Next.js App Deployment
- **Vercel**: Recommended platform with zero-config deployment
- **Environment Variables**: Set Firebase config in deployment platform
- **Build**: Runs `next build` to generate optimized production build

### WhatsApp Service Deployment
- **Separate Service**: Deploy on different platform (Railway, Heroku)
- **Port Configuration**: Ensure correct port binding for production
- **QR Code Scanning**: Will need manual intervention for initial setup
- **Persistence**: WhatsApp session data needs persistent storage

## Integration Points

### Firebase → WhatsApp Flow
1. Task completion triggers Firestore write
2. API route `/api/whatsapp-notify` fetches partner's WhatsApp number
3. HTTP request sent to WhatsApp service
4. Message delivered via WhatsApp Web

### Quest Board → Accountability System
1. `GenericQuestBoard` is generic and reusable
2. `AccountabilityPartner` provides Firebase integration
3. `onTaskComplete` callback bridges the two systems
4. Local storage maintains daily task state independently

This architecture enables easy extension for team accountability, different quest types, or alternative notification systems.
