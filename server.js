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
        
        // Fetch stream using ytdl-core
        const stream = ytdl(videoUrl, {
            quality: 'highest',
            filter: 'audioandvideo'
        });

        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="Emojora_Clip_${start}s_${end}s.mp4"`);

        ffmpeg(stream)
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
        console.error('Processing error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: err.message });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Emojora Clipper API running on port ${PORT}`);
});
