# WhatsApp Service (Baileys)

This service has been upgraded from `whatsapp-web.js` to **Baileys** for better performance, stability, and resource efficiency.

## What's New with Baileys

### Advantages over whatsapp-web.js:
- ✅ **No Puppeteer/Chromium** - Saves ~200MB and reduces memory usage
- ✅ **Direct WebSocket Protocol** - More stable and faster
- ✅ **Better Performance** - Lower CPU and memory usage
- ✅ **TypeScript Native** - Better type safety
- ✅ **Less Detection Risk** - Direct protocol communication

## Installation & Setup

1. **Install dependencies**:
   ```bash
   cd whatsapp-service
   npm install
   ```

2. **Start the service**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

3. **Scan QR Code**:
   - The QR code will appear in the terminal
   - Open WhatsApp on your phone
   - Go to Settings → Linked Devices → Link a Device
   - Scan the QR code

## API Endpoints

### Health Check
```http
GET /health
```
Returns the service status and WhatsApp connection state.

### Send Message
```http
POST /send-message
Content-Type: application/json

{
  "number": "1234567890",
  "message": "Your accountability reminder!"
}
```

### Test Message
```http
POST /test-message
Content-Type: application/json

{
  "number": "1234567890"
}
```

## Features

- ✅ QR Code authentication
- ✅ Auto-reconnection on disconnect
- ✅ Message sending to individual contacts
- ✅ Connection status monitoring
- ✅ Credential persistence
- 🔄 Multi-device support
- 🔄 Group messaging (planned)
- 🔄 Media messaging (planned)

## Phone Number Format

The service automatically formats phone numbers:
- Input: `1234567890` → Output: `11234567890@s.whatsapp.net`
- Change the country code in the `send-message` endpoint as needed

## File Structure

```
whatsapp-service/
├── server.js              # Main Baileys implementation
├── package.json           # Dependencies (Baileys)
├── .wwebjs_auth/          # Auth state storage
│   └── baileys_auth/      # Baileys credentials
└── README.md              # This file
```

## Environment Variables

- `PORT` - Service port (default: 3002)

## Troubleshooting

### QR Code Not Appearing
- Check console for errors
- Ensure WhatsApp is not already linked to 4 devices
- Restart the service

### Connection Issues
- The service auto-reconnects on disconnect
- Check internet connection
- Clear auth state and re-authenticate if needed

### Message Not Sending
- Verify WhatsApp connection status via `/health`
- Check phone number format
- Ensure recipient has WhatsApp

## Migration from whatsapp-web.js

The API endpoints remain the same, but the underlying implementation is completely different:

- **Old**: Browser automation with Puppeteer
- **New**: Direct WebSocket protocol with Baileys

Your existing accountability partner integration will work without changes!
