const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const app = express();
app.use(cors());

// Initialize ytdl-core agent with cookie support
function getYtdlAgent() {
    try {
        let cookies = [];
        
        // 1. Try reading from environment variable
        if (process.env.YOUTUBE_COOKIES) {
            cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
        } 
        // 2. Try reading local cookies.json file if present
        else if (fs.existsSync(path.join(__dirname, 'cookies.json'))) {
            const raw = fs.readFileSync(path.join(__dirname, 'cookies.json'), 'utf8');
            cookies = JSON.parse(raw);
        }
        
        if (cookies && cookies.length > 0) {
            console.log(`Loaded ${cookies.length} YouTube cookies successfully.`);
            return ytdl.createAgent(cookies);
        }
    } catch (err) {
        console.error('Error loading cookies:', err.message);
    }
    
    // Default agent fallback
    return ytdl.createAgent();
}

app.get('/', (req, res) => {
    res.json({ status: 'online', message: 'Emojora Clip Downloader Microservice API' });
});

app.get('/api/clip', async (req, res) => {
    const videoId = req.query.v;
    const start = parseInt(req.query.start || '0', 10);
    const end = parseInt(req.query.end || '15', 10);
    const duration = Math.max(1, end - start);

    if (!videoId) {
        return res.status(400).json({ error: 'Missing video ID parameter v' });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const agent = getYtdlAgent();

        const options = {
            agent,
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            }
        };

        const info = await ytdl.getInfo(videoUrl, options);
        
        let format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
        if (!format || !format.url) {
            format = info.formats.find(f => f.url);
        }

        if (!format || !format.url) {
            return res.status(404).json({ error: 'No playable video format found' });
        }

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="Emojora_Clip_${start}s_${end}s.mp4"`);

        ffmpeg(format.url)
            .setStartTime(start)
            .setDuration(duration)
            .format('mp4')
            .outputOptions([
                '-c:v copy',
                '-c:a copy',
                '-movflags frag_keyframe+empty_moov'
            ])
            .on('error', (err) => {
                console.error('FFmpeg trimming error:', err.message);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Trimming error: ' + err.message });
                }
            })
            .pipe(res, { end: true });

    } catch (err) {
        console.error('Processing error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to process video: ' + err.message });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Emojora Clipper API running on port ${PORT}`);
});
