// scripts/create_issue.js
// Reads submissions.json from the repository (action will checkout the repo)
// Uses GITHUB_TOKEN to create or update a single issue 'RSVP Daily Summary'

const fs = require('fs');
const path = require('path');

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
      submissions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    const total = submissions.length;
    const yes = submissions.filter(s => /yes/i.test(s.attendance)).length;
    const no = submissions.filter(s => /no/i.test(s.attendance)).length;

    const date = new Date().toLocaleString('en-US', { timeZone: 'UTC', hour12: false });

    const body = `Daily RSVP summary (UTC) - ${date}\n\nTotal responses: ${total}\nYes: ${yes}\nNo: ${no}\n\nView full responses: https://github.com/${owner}/${repoName}/blob/main/submissions.json`;

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
