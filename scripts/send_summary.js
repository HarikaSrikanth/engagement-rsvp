// scripts/send_summary.js
// Run in GitHub Actions checkout (node available).
// Requires env vars: SENDGRID_API_KEY, RECIPIENT_EMAIL

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

(async () => {
  try {
    const file = path.join(process.cwd(), 'submissions.json');
    if (!fs.existsSync(file)) {
      console.log('No submissions.json found — nothing to send');
      return;
    }

    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const total = data.length;
    const yes = data.filter(s => /yes/i.test(s.attendance)).length;
    const no = data.filter(s => /no/i.test(s.attendance)).length;

    const body = `Daily RSVP summary for Srikanth & Harika\n\nTotal responses: ${total}\nYes: ${yes}\nNo: ${no}\n\nDetailed responses are in the repository file submissions.json`;

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const RECIPIENT = process.env.RECIPIENT_EMAIL;
    const SENDER = process.env.SENDER_EMAIL || RECIPIENT;

    if (!SENDGRID_API_KEY || !RECIPIENT) {
      console.error('Missing SENDGRID_API_KEY or RECIPIENT_EMAIL');
      process.exit(1);
    }

    const email = {
      personalizations: [{ to: [{ email: RECIPIENT }] }],
      from: { email: SENDER },
      subject: 'Daily RSVP summary: Srikanth & Harika',
      content: [{ type: 'text/plain', value: body }]
    };

    const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(email)
    });

    if (resp.ok) {
      console.log('Summary email sent');
    } else {
      const text = await resp.text();
      console.error('SendGrid failed:', resp.status, text);
      process.exit(1);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
