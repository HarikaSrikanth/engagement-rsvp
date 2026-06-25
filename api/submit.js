// Vercel / Netlify-compatible serverless function
// Expects environment variables:
// GITHUB_TOKEN, REPO_OWNER (e.g., HarikaSrikanth), REPO_NAME (e.g., engagement-rsvp)

const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // parse body (supports form-encoded and JSON)
    const body = req.headers['content-type'] && req.headers['content-type'].includes('application/json')
      ? req.body
      : Object.fromEntries(await new Promise(resolve => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(new URLSearchParams(data)));
        }));

    const submission = {
      name: body.name || '',
      email: body.email || '',
      phone: body.phone || '',
      guests: body.guests || '',
      attendance: body.attendance || '',
      message: body.message || '',
      timestamp: new Date().toISOString()
    };

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.REPO_OWNER || 'HarikaSrikanth';
    const REPO = process.env.REPO_NAME || 'engagement-rsvp';

    if (!GITHUB_TOKEN) {
      console.error('Missing GITHUB_TOKEN');
      return res.status(500).json({ error: 'Server not configured' });
    }

    const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/submissions.json`;

    // Get existing submissions.json (if any)
    let existing = [];
    let sha = null;
    const getResp = await fetch(apiBase, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, 'User-Agent': 'rsvp-bot' }
    });

    if (getResp.status === 200) {
      const data = await getResp.json();
      sha = data.sha;
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      try { existing = JSON.parse(content); } catch(e) { existing = []; }
    }

    existing.push(submission);
    const newContent = Buffer.from(JSON.stringify(existing, null, 2)).toString('base64');

    // Create or update file
    const putResp = await fetch(apiBase, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'rsvp-bot',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `Add RSVP from ${submission.name}`,
        content: newContent,
        sha: sha || undefined
      })
    });

    if (!putResp.ok) {
      const errText = await putResp.text();
      console.error('GitHub update failed', errText);
      return res.status(500).json({ error: 'Failed to save submission' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
