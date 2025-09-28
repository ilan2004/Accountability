const { makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Socket
let sock = null;
let isClientReady = false;

// Auth state directory
const authDir = path.join(__dirname, '.wwebjs_auth', 'baileys_auth');
if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
}

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        sock = makeWASocket({
            auth: state,
            printQRInTerminal: false, // We'll handle QR ourselves
            logger: {
                level: 'warn',
                child: () => ({}),
                info: () => {},
                error: console.error,
                warn: console.warn,
                debug: () => {},
                trace: () => {},
                fatal: console.error
            },
            browser: ['Accountability Partner', 'Chrome', '4.0.0']
        });

        // Handle connection updates
        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('🔗 QR Code received! Scan it with WhatsApp:');
                qrcode.generate(qr, { small: true });
                console.log('📱 Open WhatsApp on your phone → Settings → Linked Devices → Link a Device');
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('📱 Connection closed due to:', lastDisconnect?.error, ', reconnecting:', shouldReconnect);
                
                if (shouldReconnect) {
                    connectToWhatsApp();
                } else {
                    console.log('❌ WhatsApp logged out. Please restart the service.');
                    isClientReady = false;
                }
            } else if (connection === 'open') {
                console.log('✅ WhatsApp Client is ready!');
                isClientReady = true;
            }
        });

        // Handle credentials update
        sock.ev.on('creds.update', saveCreds);
        
        // Handle messages (optional - for future features)
        sock.ev.on('messages.upsert', ({ messages, type }) => {
            if (type === 'notify') {
                for (const msg of messages) {
                    if (!msg.key.fromMe && msg.message) {
                        console.log('📨 Received message:', msg.key.remoteJid, msg.message);
                    }
                }
            }
        });

    } catch (error) {
        console.error('❌ Error connecting to WhatsApp:', error);
        setTimeout(connectToWhatsApp, 5000);
    }
}

// API Routes
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        whatsapp: isClientReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

app.post('/send-message', async (req, res) => {
    try {
        if (!isClientReady || !sock) {
            return res.status(503).json({ 
                error: 'WhatsApp client not ready. Please scan QR code first.' 
            });
        }

        const { number, message } = req.body;
        
        if (!number || !message) {
            return res.status(400).json({ 
                error: 'Missing required fields: number and message' 
            });
        }

        // Format phone number (remove any non-digits and add country code if needed)
        let formattedNumber = number.replace(/\D/g, '');
        
        // Add country code if not present (assuming +1 for US, change as needed)
        if (formattedNumber.length === 10) {
            formattedNumber = '1' + formattedNumber;
        }
        
        const jid = formattedNumber + '@s.whatsapp.net';

        // Send message using Baileys
        await sock.sendMessage(jid, { text: message });
        
        console.log(`📤 Message sent to ${formattedNumber}: ${message.substring(0, 50)}...`);
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            to: formattedNumber
        });
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        res.status(500).json({ 
            error: 'Failed to send message', 
            details: error.message 
        });
    }
});

// Test endpoint to send a test message
app.post('/test-message', async (req, res) => {
    try {
        const { number } = req.body;
        
        if (!number) {
            return res.status(400).json({ error: 'Phone number is required' });
        }

        const testMessage = `🧪 *Test Message*\n\nThis is a test message from your Accountability Partner system!\n\nIf you receive this, WhatsApp integration is working perfectly! 🎉\n\nTime: ${new Date().toLocaleString()}`;
        
        // Send directly using our send-message endpoint
        const response = await fetch(`http://localhost:${PORT}/send-message`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, message: testMessage })
        });

        if (response.ok) {
            res.json({ success: true, message: 'Test message sent!' });
        } else {
            const error = await response.json();
            res.status(500).json({ error: 'Failed to send test message', details: error });
        }
    } catch (error) {
        console.error('Error in test-message:', error);
        res.status(500).json({ error: 'Failed to send test message' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log('🔄 Starting WhatsApp Connection...');
    
    // Initialize WhatsApp connection
    connectToWhatsApp();
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down WhatsApp Service...');
    if (sock) {
        sock.end();
    }
    process.exit(0);
});

module.exports = { app, sock };
