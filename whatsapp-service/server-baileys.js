const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('baileys');
const { Boom } = require('@hapi/boom');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth state management
const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');

// Ensure auth folder exists
if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

let sock;
let qrRetries = 0;
let isConnected = false;
let connectionState = 'disconnected';

// Store active connections and retry logic
const MAX_QR_RETRIES = 3;
const RECONNECT_INTERVAL = 5000;

async function connectToWhatsApp() {
    try {
        // Create auth state
        const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
        
        // Create socket
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: true,
            logger: {
                level: 'silent' // Reduce logging noise
            },
            browser: ['Accountability Partner Bot', 'Chrome', '1.0.0'],
            defaultQueryTimeoutMs: 60000,
        });

        // Connection events
        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            console.log('🔄 Connection update:', { connection, qr: !!qr });
            connectionState = connection || 'unknown';
            
            if (qr) {
                console.log('📱 New QR Code generated! Scan with your phone.');
                qrRetries++;
                
                if (qrRetries > MAX_QR_RETRIES) {
                    console.log('⚠️ Maximum QR retries reached. Stopping connection attempts.');
                    return;
                }
            }
            
            if (connection === 'close') {
                isConnected = false;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                
                if (shouldReconnect) {
                    console.log('🔄 Reconnecting to WhatsApp...');
                    setTimeout(connectToWhatsApp, RECONNECT_INTERVAL);
                } else {
                    console.log('❌ Connection closed. You are logged out.');
                    console.log('🔑 Delete auth_info_baileys folder and restart to get a new QR code.');
                }
            } else if (connection === 'open') {
                isConnected = true;
                qrRetries = 0;
                console.log('✅ WhatsApp connected successfully!');
                console.log('📱 Bot is ready to send messages.');
            }
        });

        // Save credentials on update
        sock.ev.on('creds.update', saveCreds);

        // Message events (for debugging/logging)
        sock.ev.on('messages.upsert', (m) => {
            if (process.env.NODE_ENV === 'development') {
                console.log('📨 Message received:', JSON.stringify(m, undefined, 2));
            }
        });

        return sock;
    } catch (error) {
        console.error('❌ Error connecting to WhatsApp:', error);
        setTimeout(connectToWhatsApp, RECONNECT_INTERVAL);
    }
}

// Format phone number for WhatsApp
function formatPhoneNumber(number) {
    // Remove all non-digits
    let cleaned = number.replace(/\D/g, '');
    
    // Add country code if missing (defaulting to India +91, change as needed)
    if (cleaned.length === 10) {
        cleaned = '91' + cleaned; // Change '91' to your country code
    }
    
    // Remove leading + if present
    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    
    return cleaned + '@s.whatsapp.net';
}

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        whatsapp: isConnected ? 'connected' : 'disconnected',
        connectionState,
        timestamp: new Date().toISOString(),
        authFolderExists: fs.existsSync(AUTH_FOLDER),
        version: 'baileys'
    });
});

app.post('/send-message', async (req, res) => {
    try {
        if (!isConnected || !sock) {
            return res.status(503).json({ 
                error: 'WhatsApp not connected. Check /health endpoint for status.',
                connectionState
            });
        }

        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: number and message' 
            });
        }

        // Format the number
        const jid = formatPhoneNumber(number);
        
        // Send message
        const result = await sock.sendMessage(jid, { text: message });
        
        console.log(`📤 Message sent to ${jid}: ${message.substring(0, 50)}...`);
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            to: jid,
            messageId: result.key.id
        });
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to send message';
        if (error.output?.statusCode === 404) {
            errorMessage = 'Phone number not found on WhatsApp';
        } else if (error.output?.statusCode === 401) {
            errorMessage = 'Not authorized to send messages';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: error.message,
            code: error.output?.statusCode
        });
    }
});

// Test endpoint
app.post('/test-message', async (req, res) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const testMessage = `🧪 *Baileys Test Message*\n\nThis is a test message from your Accountability Partner system using Baileys! 🚀\n\nIf you receive this, the new WhatsApp integration is working perfectly! 🎉\n\nTime: ${new Date().toLocaleString()}\nVersion: Baileys v7.x`;
        
        // Use our own send-message endpoint
        const response = await fetch(`http://localhost:${PORT}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, message: testMessage })
        });

        if (response.ok) {
            res.json({ success: true, message: 'Test message sent successfully!' });
        } else {
            const error = await response.json();
            res.status(response.status).json(error);
        }
    } catch (error) {
        console.error('❌ Error in test endpoint:', error);
        res.status(500).json({ error: 'Failed to send test message', details: error.message });
    }
});

// Reset authentication (useful for development)
app.post('/reset-auth', (req, res) => {
    try {
        if (fs.existsSync(AUTH_FOLDER)) {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
            console.log('🔄 Authentication reset. Restart server to get new QR code.');
        }
        
        isConnected = false;
        connectionState = 'reset';
        
        res.json({ 
            success: true, 
            message: 'Authentication reset successfully. Restart server to reconnect.' 
        });
    } catch (error) {
        console.error('❌ Error resetting auth:', error);
        res.status(500).json({ error: 'Failed to reset authentication' });
    }
});

// Start the server
app.listen(PORT, async () => {
    console.log(`🚀 Baileys WhatsApp Service running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${PORT}/test-message`);
    console.log('🔄 Connecting to WhatsApp...');
    
    // Start WhatsApp connection
    await connectToWhatsApp();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Baileys WhatsApp Service...');
    if (sock) {
        await sock.logout();
    }
    process.exit(0);
});

module.exports = { app, sock };
