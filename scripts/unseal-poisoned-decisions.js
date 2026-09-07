const fs = require('fs');
const path = require('path');
const { generateMarkdown } = require('./sync-decisions.js');

const FIRESTORE_API_KEY = 'AIzaSyCjxLuDQ7EktomeXveVoXHaDe6vrfDDxMY';
const PROJECT_ID = 'echo-guy-2026';
const ROOT_DIR = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.json');
const MD_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.md');

async function unsealInFirestore(decId, userId) {
  const urlRoot = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/decisions/${decId}?updateMask.fieldPaths=sealed&updateMask.fieldPaths=selectedCriterion&key=${FIRESTORE_API_KEY}`;
  const urlUser = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userId}/decisions/${decId}?updateMask.fieldPaths=sealed&updateMask.fieldPaths=selectedCriterion&key=${FIRESTORE_API_KEY}`;

  const body = JSON.stringify({
    fields: {
      sealed: { booleanValue: false },
      selectedCriterion: { stringValue: '' }
    }
  });

  try {
    const res1 = await fetch(urlRoot, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    const res2 = await fetch(urlUser, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    });
    console.log(`[Firestore Unseal]: ${decId} -> Root: ${res1.status}, User: ${res2.status}`);
  } catch (err) {
    console.warn(`[Firestore Unseal Error] ${decId}:`, err.message);
  }
}

async function runUnseal() {
  console.log('=== Unsealing Poisoned Decisions (Phase 0 Step 6) ===\n');
  const fileContent = fs.readFileSync(JSON_PATH, 'utf8');
  const data = JSON.parse(fileContent);

  let unsealedCount = 0;
  for (const dec of data.decisions) {
    const crit = dec.selectedCriterion || '';
    const isPoisoned = dec.sealed && (
      crit.includes('קריטריון מוצע ראשון') ||
      crit.includes('ייקבע עם לכידת הדילמה') ||
      crit.length < 15
    );

    if (isPoisoned) {
      console.log(`Unsealing poisoned decision: ${dec.id} ("${dec.title}")`);
      dec.sealed = false;
      dec.reviewStatus = 'pending';
      delete dec.sealedAt;
      dec.selectedCriterion = '';
      dec.selectedCriterionType = 'unsealed_placeholder';
      unsealedCount++;

      // Patch Firestore
      await unsealInFirestore(dec.id, dec.userId || 'guy_founder');
    }
  }

  const nowIso = new Date().toISOString();
  data.metadata.generatedAt = nowIso;
  data.metadata.totalDecisions = data.decisions.length;
  data.metadata.sealedDecisions = data.decisions.filter(d => d.sealed).length;

  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nUpdated ${JSON_PATH}`);

  const md = generateMarkdown(data.decisions, nowIso);
  fs.writeFileSync(MD_PATH, md, 'utf8');
  console.log(`Updated ${MD_PATH}`);

  console.log(`\n✓ Successfully unsealed ${unsealedCount} poisoned decisions.`);
  console.log(`Active sealed count is now: ${data.metadata.sealedDecisions} (Expected: 4).`);
}

runUnseal().catch(console.error);
