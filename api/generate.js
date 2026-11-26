// api/generate.js
import { generateImage, experimental_generateVideo as generateVideo } from 'ai';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, type, model, duration, aspectRatio } = req.body;

    if (!prompt || !type) {
      return res.status(400).json({ error: 'Missing prompt or type' });
    }

    if (type === 'image') {
      // Image generation — synchronous, fast
      const result = await generateImage({
        model: model || 'bfl/flux-2-flex',
        prompt,
      });

      const image = result.images[0];
      const base64 = Buffer.from(image.uint8Array).toString('base64');

      return res.status(200).json({
        type: 'image',
        data: `data:image/png;base64,${base64}`,
        mimeType: 'image/png',
      });
    }

    if (type === 'video') {
      // Video generation — synchronous but long-running (up to 15 min on Vercel)
      const result = await generateVideo({
        model: model || 'google/veo-3.1-fast-generate-001',
        prompt,
        duration: duration || 8,
        aspectRatio: aspectRatio || '16:9',
        generateAudio: true,
      });

      const video = result.videos[0];
      const base64 = Buffer.from(video.uint8Array).toString('base64');

      return res.status(200).json({
        type: 'video',
        data: `data:video/mp4;base64,${base64}`,
        mimeType: 'video/mp4',
      });
    }

    return res.status(400).json({ error: 'Invalid type. Use "image" or "video".' });
  } catch (error) {
    console.error('Generation error:', error);
    return res.status(500).json({ error: error.message || 'Generation failed' });
  }
}
