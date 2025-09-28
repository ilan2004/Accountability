const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "accountability-partner"
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let isClientReady = false;

// WhatsApp Client Events
client.on('qr', (qr) => {
    console.log('🔗 QR Code received! Scan it with WhatsApp:');
    qrcode.generate(qr, { small: true });
    console.log('📱 Open WhatsApp on your phone → Settings → Linked Devices → Link a Device');
});

client.on('ready', () => {
    console.log('✅ WhatsApp Client is ready!');
    isClientReady = true;
});

client.on('authenticated', () => {
    console.log('🔐 WhatsApp Client authenticated!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('📱 WhatsApp Client was logged out:', reason);
    isClientReady = false;
});

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
        if (!isClientReady) {
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
        
        // Add country code if not present (assuming +91 for India, change as needed)
        if (formattedNumber.length === 10) {
            formattedNumber = '91' + formattedNumber;
        }
        
        const chatId = formattedNumber + '@c.us';

        // Send message
        await client.sendMessage(chatId, message);
        
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
        
        await fetch('http://localhost:3001/send-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, message: testMessage })
        });

        res.json({ success: true, message: 'Test message sent!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send test message' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 WhatsApp Service running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/health`);
    console.log('🔄 Starting WhatsApp Client...');
});

// Initialize WhatsApp Client
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down WhatsApp Service...');
    await client.destroy();
    process.exit(0);
});

module.exports = { app, client };
