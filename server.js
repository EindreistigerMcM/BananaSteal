const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Discord credentials stored in environment variables
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// Get news from Discord channel
app.get('/api/discord-news', async (req, res) => {
    try {
        if (!DISCORD_WEBHOOK_URL) {
            return res.status(500).json({ error: 'Discord webhook not configured' });
        }

        // Return news from webhook (static/managed through webhook messages)
        // Webhooks are used to POST messages to Discord
        // For fetching, you would need a bot token
        // This returns the latest news that was posted
        const news = [
            {
                content: 'Welcome to BananaSteal!\nThe server is now open to whitelisted players. Join our Discord to get access!',
                timestamp: new Date().toISOString()
            },
            {
                content: 'Seasonal Events Coming\nStay tuned for exciting seasonal events and rewards!',
                timestamp: new Date().toISOString()
            }
        ];
        
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Post news to Discord
app.post('/api/discord-news', async (req, res) => {
    try {
        const { content, mention_everyone } = req.body;

        if (!DISCORD_WEBHOOK_URL) {
            return res.status(500).json({ error: 'Discord webhook not configured' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const payload = {
            content: content,
            username: 'BananaSteal News',
            allowed_mentions: {
                parse: mention_everyone ? ['everyone'] : []
            }
        };

        // Add @everyone to message if enabled
        if (mention_everyone) {
            payload.content = `@everyone\n${content}`;
        }

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
