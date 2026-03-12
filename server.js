const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/analyze', (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('ERROR: ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const body = JSON.stringify(req.body);

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const request = https.request(options, (response) => {
    let data = '';
    response.on('data', chunk => data += chunk);
    response.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.error) console.error('Anthropic error:', JSON.stringify(parsed.error));
        res.json(parsed);
      } catch (e) {
        console.error('Parse error:', e.message);
        res.status(500).json({ error: 'Failed to parse Anthropic response' });
      }
    });
  });

  request.on('error', (err) => {
    console.error('HTTPS error:', err.message);
    res.status(500).json({ error: 'Failed to reach Anthropic API' });
  });

  request.write(body);
  request.end();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ReadTheConvo running on port ${PORT}`));
