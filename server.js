const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
}

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${timestamp}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Only allow images
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

// Discord credentials stored in environment variables
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

// File to store news
const newsFilePath = path.join(__dirname, 'news.json');

// Initialize news file if it doesn't exist
function initializeNewsFile() {
    if (!fs.existsSync(newsFilePath)) {
        const defaultNews = [];
        fs.writeFileSync(newsFilePath, JSON.stringify(defaultNews, null, 2));
    }
}

// Get stored news
function getNews() {
    try {
        if (fs.existsSync(newsFilePath)) {
            const data = fs.readFileSync(newsFilePath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error reading news file:', error);
    }
    return [];
}

// Save news to file
function saveNews(news) {
    try {
        fs.writeFileSync(newsFilePath, JSON.stringify(news, null, 2));
    } catch (error) {
        console.error('Error saving news file:', error);
    }
}

// Get news from Discord channel
app.get('/api/discord-news', async (req, res) => {
    try {
        const news = getNews();
        res.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Post news to Discord
app.post('/api/discord-news', async (req, res) => {
    try {
        const { content } = req.body;

        if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
            return res.status(500).json({ error: 'Discord bot not configured' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const payload = {
            content: content
        };

        const response = await fetch(
            `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Discord API error: ${text}`);
        }

        // Store news locally
        const news = getNews();
        news.unshift({
            content: content,
            timestamp: new Date().toISOString()
        });

        if (news.length > 20) news.pop();
        saveNews(news);

        res.json({ success: true, message: 'News posted with bot and saved!' });

    } catch (error) {
        console.error('Error posting to Discord with bot:', error);
        res.status(500).json({ error: 'Failed to post news' });
    }
});

// Upload image endpoint
app.post('/api/discord-news', async (req, res) => {
    try {
        const { content } = req.body;

        if (!DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
            return res.status(500).json({ error: 'Discord bot not configured' });
        }

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const payload = {
            content: content
        };

        const response = await fetch(
            `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Discord API error: ${text}`);
        }

        // Store news locally
        const news = getNews();
        news.unshift({
            content: content,
            timestamp: new Date().toISOString()
        });

        if (news.length > 20) news.pop();
        saveNews(news);

        res.json({ success: true, message: 'News posted with bot and saved!' });

    } catch (error) {
        console.error('Error posting to Discord with bot:', error);
        res.status(500).json({ error: 'Failed to post news' });
    }
});

const PORT = process.env.PORT || 3000;

// Initialize news file on startup
initializeNewsFile();

app.listen(PORT, () => {
    console.log(`🍌 BananaSteal server running on http://localhost:${PORT}`);
    if (!DISCORD_BOT_TOKEN) {
        console.warn('⚠️  DISCORD_WEBHOOK_URL not set. Set it as an environment variable.');
    }
});
