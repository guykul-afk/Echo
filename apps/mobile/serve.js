const http = require('http');
const fs = require('fs');
const path = require('path');
const { syncDecisionCycles, fetchAllDecisionsFromFirestore, generateMarkdown } = require('../../scripts/sync-decisions.js');

const ROOT_DIR = path.resolve(__dirname, '../..');
const MD_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.md');
const JSON_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.json');

// Local cached decisions to allow instant updates without waiting for full cloud roundtrip
let localDecisionsCache = [];

async function refreshCacheFromFirestore() {
  try {
    localDecisionsCache = await fetchAllDecisionsFromFirestore();
    const nowIso = new Date().toISOString();
    const md = generateMarkdown(localDecisionsCache, nowIso);
    fs.writeFileSync(MD_OUTPUT_PATH, md, 'utf8');
    fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify({
      metadata: {
        generatedAt: nowIso,
        totalDecisions: localDecisionsCache.length,
        user: localDecisionsCache[0]?.userId || 'guy_founder'
      },
      decisions: localDecisionsCache
    }, null, 2), 'utf8');
    console.log(`[ECHO Server]: DECISION_CYCLES.md updated (${localDecisionsCache.length} decisions)`);
  } catch (err) {
    console.error('[ECHO Server]: Cloud sync error:', err.message);
  }
}

function updateLocalFileWithDecision(decision) {
  if (!decision || !decision.id) return;
  const idx = localDecisionsCache.findIndex(d => d.id === decision.id);
  if (idx >= 0) {
    localDecisionsCache[idx] = { ...localDecisionsCache[idx], ...decision };
  } else {
    localDecisionsCache.push(decision);
  }

  // Sort chronologically
  localDecisionsCache.sort((a, b) => (a.frozenAt || 0) - (b.frozenAt || 0));

  const nowIso = new Date().toISOString();
  const md = generateMarkdown(localDecisionsCache, nowIso);
  fs.writeFileSync(MD_OUTPUT_PATH, md, 'utf8');
  fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify({
    metadata: {
      generatedAt: nowIso,
      totalDecisions: localDecisionsCache.length,
      user: localDecisionsCache[0]?.userId || 'guy_founder'
    },
    decisions: localDecisionsCache
  }, null, 2), 'utf8');
  console.log(`[ECHO Server]: Instantly updated DECISION_CYCLES.md for decision ${decision.id} ("${decision.title || ''}")`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API 1: Instant sync upon capture / update
  if (url.pathname === '/api/sync-decision' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        updateLocalFileWithDecision(payload);
        
        // Also schedule a background fresh fetch from Firestore after 2s to guarantee consistency
        setTimeout(() => refreshCacheFromFirestore().catch(() => {}), 2000);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: localDecisionsCache.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API 2: Manual trigger to sync everything from Firestore
  if (url.pathname === '/api/sync-decisions') {
    try {
      await refreshCacheFromFirestore();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: localDecisionsCache.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Static files handling
  let reqPath = url.pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(__dirname, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Fallback to index.html for SPA
  const indexPath = path.join(__dirname, 'index.html');
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
});

const PORT = 8085;
server.listen(PORT, async () => {
  console.log(`ECHO Mobile Web Server running at http://localhost:${PORT}/`);
  console.log(`[ECHO Server]: Initializing and syncing DECISION_CYCLES.md from Firestore...`);
  await refreshCacheFromFirestore();
});

// Periodic background sync every 60 seconds
setInterval(() => {
  refreshCacheFromFirestore().catch(() => {});
}, 60000);
