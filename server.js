const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

if (ffmpegPath) {
    ffmpeg.setFfmpegPath(ffmpegPath);
}

const app = express();
app.use(cors());

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
        
        // Use agent with cookies if provided in environment, or default fallback
        let agent;
        try {
            if (process.env.YOUTUBE_COOKIES) {
                const cookies = JSON.parse(process.env.YOUTUBE_COOKIES);
                agent = ytdl.createAgent(cookies);
            } else {
                agent = ytdl.createAgent();
            }
        } catch (e) {}

        const options = {
            ...(agent ? { agent } : {}),
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
