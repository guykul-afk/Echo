const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables if available (.env in root or apps/mobile)
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {}
try {
  require('dotenv').config({ path: path.resolve(__dirname, '.env') });
} catch (e) {}

const { syncDecisionCycles, fetchAllDecisionsFromFirestore, generateMarkdown } = require('../../scripts/sync-decisions.js');

const ROOT_DIR = path.resolve(__dirname, '../..');
const MD_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.md');
const JSON_OUTPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.json');
const USER_PROFILES_PATH = path.join(ROOT_DIR, 'USER_PROFILES.json');

const { DecisionProfileService } = require('../../packages/backend/dist/services/decisionProfile.service.js');
const decisionProfileService = new DecisionProfileService();

// Local cached decisions to allow instant updates without waiting for full cloud roundtrip
let localDecisionsCache = [];
const userProfilesCache = new Map();

// Initialize profiles from disk if available
try {
  if (fs.existsSync(USER_PROFILES_PATH)) {
    const rawProfiles = JSON.parse(fs.readFileSync(USER_PROFILES_PATH, 'utf8'));
    for (const [uid, p] of Object.entries(rawProfiles)) {
      userProfilesCache.set(uid, p);
    }
  }
} catch (e) {
  console.warn('[ECHO Server]: Could not load USER_PROFILES.json:', e.message);
}

function saveAllUserProfiles() {
  try {
    const obj = {};
    for (const [uid, p] of userProfilesCache.entries()) {
      obj[uid] = p;
    }
    fs.writeFileSync(USER_PROFILES_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[ECHO Server]: Error saving USER_PROFILES.json:', e.message);
  }
}

function normalizeUserId(userId) {
  const norm = (userId || '').trim();
  if (!norm || norm === 'guest') return 'guest';
  if (
    norm === 'Guy_Kuleski' || 
    norm === 'guy_kuleski' || 
    norm === 'guy kuleski' || 
    norm === 'guy_founder' ||
    norm.toLowerCase().includes('kuleski') || 
    norm.toLowerCase().includes('guykul')
  ) {
    return 'Guy_Kuleski';
  }
  return norm;
}

async function getOrGenerateUserProfile(userId, forceRefresh = false) {
  const canonicalId = normalizeUserId(userId);
  if (!forceRefresh && userProfilesCache.has(canonicalId)) {
    return userProfilesCache.get(canonicalId);
  }

  // Ensure decisions are loaded
  if (localDecisionsCache.length === 0 && fs.existsSync(JSON_OUTPUT_PATH)) {
    try {
      const existing = JSON.parse(fs.readFileSync(JSON_OUTPUT_PATH, 'utf8'));
      if (existing && Array.isArray(existing.decisions) && existing.decisions.length > 0) {
        localDecisionsCache = existing.decisions;
      }
    } catch {}
  }

  // Filter decisions for user (for founder, include all founder decisions or all local decisions)
  let userDecisions = localDecisionsCache;
  if (canonicalId !== 'Guy_Kuleski') {
    userDecisions = localDecisionsCache.filter(d => d.userId === canonicalId);
  }

  const isFounder = canonicalId === 'Guy_Kuleski';
  const profile = await decisionProfileService.generateProfile(canonicalId, userDecisions, {
    userName: isFounder ? 'Guy Kuleski' : canonicalId,
    gender: 'male'
  });

  userProfilesCache.set(canonicalId, profile);
  saveAllUserProfiles();
  console.log(`[ECHO Server]: Epistemic Profile generated and saved for user "${canonicalId}" (${userDecisions.length} decisions).`);
  return profile;
}

async function refreshCacheFromFirestore() {
  try {
    const fetched = await fetchAllDecisionsFromFirestore();
    if (fetched && fetched.length > 0) {
      localDecisionsCache = fetched;
    } else if (localDecisionsCache.length === 0 && fs.existsSync(JSON_OUTPUT_PATH)) {
      try {
        const existing = JSON.parse(fs.readFileSync(JSON_OUTPUT_PATH, 'utf8'));
        if (existing && Array.isArray(existing.decisions) && existing.decisions.length > 0) {
          console.log(`[ECHO Server]: Firestore returned 0 docs. Preserving ${existing.decisions.length} local decisions.`);
          localDecisionsCache = existing.decisions;
        }
      } catch {}
    }

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
    
    // Automatically recalculate and persist Guy Kuleski's profile on server
    await getOrGenerateUserProfile('Guy_Kuleski', true);
    
    checkDueDecisionsAndAlert();
  } catch (err) {
    console.error('[ECHO Server]: Cloud sync error:', err.message);
  }
}

function checkDueDecisionsAndAlert() {
  const now = Date.now();
  const dueDecisions = localDecisionsCache.filter(d => 
    d.sealed && 
    d.dueDate && 
    d.dueDate <= now && 
    d.reviewStatus !== 'completed'
  );

  if (dueDecisions.length > 0) {
    console.log(`\n🔔 [ECHO Learning Loop Alert]: נמצאו ${dueDecisions.length} החלטות שהגיע מועד הבדיקה שלהן!`);
    dueDecisions.forEach(d => {
      const crit = d.selectedCriterion || d.customCriterion || 'ללא קריטריון';
      console.log(`   📌 "${d.title}" (ID: ${d.id}) - קריטריון לבחינה: "${crit}"`);
    });
    console.log(`   👉 גש לאפליקציה ב-http://localhost:8085/ לסגירת מעגל ב-5 שניות.\n`);
  }
}

async function updateLocalFileWithDecision(decision) {
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

  // Recalculate and update profile on server
  await getOrGenerateUserProfile(decision.userId || 'Guy_Kuleski', true).catch(() => {});
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

  // API 1.5: Gemini Proxy
  if (url.pathname === '/api/gemini' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        let modelName = payload.model || 'gemini-3.6-flash';
        if (modelName.includes('2.0') || modelName.includes('2.5') || modelName.includes('3.5')) {
          modelName = 'gemini-3.6-flash';
        }
        
        // Use apiKey from body, request header, or server environment
        const apiKey = payload.apiKey || req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        if (!apiKey) {
           res.writeHead(400, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ error: 'GEMINI_API_KEY is missing on server' }));
           return;
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        
        // We expect payload.contents and payload.generationConfig from the frontend
        const geminiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             contents: payload.contents,
             generationConfig: payload.generationConfig,
             systemInstruction: payload.systemInstruction
          })
        });

        const geminiData = await geminiRes.json();
        res.writeHead(geminiRes.status, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(geminiData));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API 1.6: Decision Service - Create Case with Delta Engine & Memory
  if (url.pathname === '/api/decision/create' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const { DecisionService, GeminiAiProvider, MockAiProvider } = await import('../../packages/backend/dist/index.js');
        const apiKey = payload.apiKey || req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        const provider = apiKey ? new GeminiAiProvider(apiKey, 'gemini-3.6-flash') : new MockAiProvider();
        const decisionService = new DecisionService(provider);

        if (!payload.userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'UNAUTHENTICATED: User must be authenticated to capture a decision.' }));
          return;
        }

        const sessionState = await decisionService.createCase({
          userId: payload.userId,
          rawText: payload.rawText || '',
          frictionLevel: payload.frictionLevel
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, sessionState }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API 1.7: Decision Service - Submit Answer & Compute Delta
  if (url.pathname === '/api/decision/answer' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (!payload.userId) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'UNAUTHENTICATED: User must be authenticated to submit deliberation answer.' }));
          return;
        }

        const { DecisionService, GeminiAiProvider, MockAiProvider } = await import('../../packages/backend/dist/index.js');
        const apiKey = payload.apiKey || req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY;
        const provider = apiKey ? new GeminiAiProvider(apiKey, 'gemini-3.6-flash') : new MockAiProvider();
        const decisionService = new DecisionService(provider);

        const result = await decisionService.submitDeliberationAnswer(
          payload.caseId,
          payload.userAnswer || '',
          Boolean(payload.skip),
          payload.userId
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, result }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // API 2: Manual trigger to sync everything from Firestore
  if (url.pathname === '/api/sync-decisions') {
    try {
      await refreshCacheFromFirestore();
      checkDueDecisionsAndAlert();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, count: localDecisionsCache.length }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // API 3: Get decisions due for 5-second outcome closure
  if (url.pathname === '/api/due-decisions') {
    const now = Date.now();
    const due = localDecisionsCache.filter(d => 
      d.sealed && 
      d.dueDate && 
      d.dueDate <= now && 
      d.reviewStatus !== 'completed'
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: due.length, decisions: due }));
    return;
  }

  // API 4: Get User Epistemic Profile (Backend-calculated and persisted)
  if (url.pathname === '/api/user-profile' && req.method === 'GET') {
    const reqUserId = url.searchParams.get('userId') || 'Guy_Kuleski';
    try {
      const profile = await getOrGenerateUserProfile(reqUserId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(profile));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // API 5: Force Refresh User Epistemic Profile
  if (url.pathname === '/api/user-profile/refresh' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const reqUserId = payload.userId || 'Guy_Kuleski';
        const profile = await getOrGenerateUserProfile(reqUserId, true);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(profile));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Handle /DECISION_CYCLES.json static route cleanly
  if (url.pathname === '/DECISION_CYCLES.json') {
    const p = fs.existsSync(JSON_OUTPUT_PATH) ? JSON_OUTPUT_PATH : path.join(__dirname, 'public/DECISION_CYCLES.json');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    fs.createReadStream(p).pipe(res);
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
