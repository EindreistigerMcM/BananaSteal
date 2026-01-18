const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Discord webhook URL stored in environment variable
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Get news from Discord channel
app.get('/api/discord-news', async (req, res) => {
    try {
        if (!DISCORD_WEBHOOK_URL) {
            return res.status(500).json({ error: 'Discord webhook not configured' });
        }

        // Fetch messages from Discord channel
        // Note: This requires a Discord bot token with proper permissions
        // For now, we'll return a placeholder
        res.json([
            {
                content: 'Welcome to BananaSteal!\nThe server is now open to whitelisted players.',
                timestamp: new Date().toISOString()
            }
        ]);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Post news to Discord
app.post('/api/discord-news', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!DISCORD_WEBHOOK_URL) {
            return res.status(500).json({ error: 'Discord webhook not configured' });
        }

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content required' });
        }

        const payload = {
            content: `**${title}**\n${content}`,
            username: 'BananaSteal News Bot'
        };

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.statusText}`);
        }

        res.json({ success: true, message: 'News posted to Discord' });
    } catch (error) {
        console.error('Error posting to Discord:', error);
        res.status(500).json({ error: 'Failed to post news' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🍌 BananaSteal server running on http://localhost:${PORT}`);
    if (!DISCORD_WEBHOOK_URL) {
        console.warn('⚠️  DISCORD_WEBHOOK_URL not set. Set it as an environment variable.');
    }
});
