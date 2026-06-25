// scripts/create_issue.js
// Reads submissions.json from the repository (action will checkout the repo)
// Uses GITHUB_TOKEN to create or update a single issue 'RSVP Daily Summary'

const fs = require('fs');
const path = require('path');

function parseISO(s) {
  try { return new Date(s); } catch { return null; }
}

(async () => {
  try {
    const repo = process.env.GITHUB_REPOSITORY; // owner/repo
    const token = process.env.GITHUB_TOKEN;
    if (!repo || !token) {
      console.error('GITHUB_REPOSITORY or GITHUB_TOKEN not set');
      process.exit(1);
    }

    const [owner, repoName] = repo.split('/');
    const filePath = path.join(process.cwd(), 'submissions.json');
    let submissions = [];
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (raw.length === 0) {
          submissions = [];
        } else {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) submissions = parsed;
          else if (parsed && typeof parsed === 'object') submissions = Object.values(parsed);
          else submissions = [];
        }
      } catch (e) {
        console.warn('Failed to parse submissions.json, using empty list', e.message);
        submissions = [];
      }
    }

    // Cumulative totals
    const totalAll = submissions.length;
    const yesAll = submissions.filter(s => /yes/i.test(String(s.attendance))).length;
    const noAll = submissions.filter(s => /no/i.test(String(s.attendance))).length;

    // Compute today's (UTC) window
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

    const todays = submissions.filter(s => {
      if (!s.timestamp) return false;
      const t = parseISO(s.timestamp);
      if (!t || isNaN(t.getTime())) return false;
      return t >= startOfToday && t < startOfTomorrow;
    });

    const totalToday = todays.length;
    const yesToday = todays.filter(s => /yes/i.test(String(s.attendance))).length;
    const noToday = todays.filter(s => /no/i.test(String(s.attendance))).length;

    const dateUTC = startOfToday.toISOString().slice(0,10);

    const body = `RSVP Daily Summary for ${dateUTC} (UTC)\n\nToday (new): ${totalToday} responses\n  Yes: ${yesToday}\n  No: ${noToday}\n\nCumulative total: ${totalAll} responses\n  Yes: ${yesAll}\n  No: ${noAll}\n\nView full responses: https://github.com/${owner}/${repoName}/blob/main/submissions.json`;

    const headers = {
      Authorization: `token ${token}`,
      'User-Agent': 'rsvp-bot',
      'Content-Type': 'application/json'
    };

    // Find existing issue titled 'RSVP Daily Summary'
    const issuesUrl = `https://api.github.com/repos/${owner}/${repoName}/issues?state=open&per_page=100`;
    const issuesResp = await fetch(issuesUrl, { headers });
    const issues = await issuesResp.json();

    const title = 'RSVP Daily Summary';
    const existing = issues.find(i => i.title === title);

    if (existing) {
      // Update the issue body
      const patchUrl = `https://api.github.com/repos/${owner}/${repoName}/issues/${existing.number}`;
      const patchResp = await fetch(patchUrl, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ body })
      });
      if (!patchResp.ok) {
        const t = await patchResp.text();
        console.error('Failed to update issue', patchResp.status, t);
        process.exit(1);
      }
      console.log('Updated existing issue', existing.number);
    } else {
      // Create new issue
      const createUrl = `https://api.github.com/repos/${owner}/${repoName}/issues`;
      const createResp = await fetch(createUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, body })
      });
      if (!createResp.ok) {
        const t = await createResp.text();
        console.error('Failed to create issue', createResp.status, t);
        process.exit(1);
      }
      const j = await createResp.json();
      console.log('Created issue', j.number);
    }

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
