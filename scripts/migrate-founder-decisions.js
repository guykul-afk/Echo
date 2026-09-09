const fs = require('fs');
const path = require('path');

const FIRESTORE_API_KEY = 'AIzaSyCjxLuDQ7EktomeXveVoXHaDe6vrfDDxMY';
const PROJECT_ID = 'echo-guy-2026';
const ROOT_DIR = path.resolve(__dirname, '..');
const JSON_INPUT_PATH = path.join(ROOT_DIR, 'DECISION_CYCLES.json');

async function migrateFounderDecisions() {
  console.log('[Migration]: קורא החלטות מקובץ DECISION_CYCLES.json...');
  if (!fs.existsSync(JSON_INPUT_PATH)) {
    console.error('❌ קובץ DECISION_CYCLES.json לא נמצא.');
    return;
  }

  const raw = fs.readFileSync(JSON_INPUT_PATH, 'utf8');
  const data = JSON.parse(raw);
  const decisions = data.decisions || [];

  console.log(`[Migration]: נמצאו ${decisions.length} החלטות לשימור עבור המשתמש guy_founder.`);

  let successCount = 0;
  let failCount = 0;

  for (const d of decisions) {
    const docId = d.id;
    if (!docId) continue;

    // Convert JS values to Firestore REST fields
    const fields = {};
    for (const [key, val] of Object.entries(d)) {
      if (val === null || val === undefined) {
        fields[key] = { nullValue: null };
      } else if (typeof val === 'string') {
        fields[key] = { stringValue: val };
      } else if (typeof val === 'number') {
        if (Number.isInteger(val)) {
          fields[key] = { integerValue: val.toString() };
        } else {
          fields[key] = { doubleValue: val };
        }
      } else if (typeof val === 'boolean') {
        fields[key] = { booleanValue: val };
      } else if (Array.isArray(val)) {
        fields[key] = {
          arrayValue: {
            values: val.map(v => (typeof v === 'string' ? { stringValue: v } : { stringValue: JSON.stringify(v) }))
          }
        };
      } else if (typeof val === 'object') {
        fields[key] = { stringValue: JSON.stringify(val) };
      }
    }

    // Write to users/guy_founder/decisions/{docId}
    const targetUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/guy_founder/decisions/${docId}?key=${FIRESTORE_API_KEY}`;
    
    try {
      const res = await fetch(targetUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      });

      if (res.ok) {
        successCount++;
      } else {
        const errText = await res.text();
        console.warn(`[Migration]: שגיאה בהעברת החלטה ${docId}:`, errText);
        failCount++;
      }
    } catch (e) {
      console.error(`[Migration]: כשל ברשת עבור ${docId}:`, e.message);
      failCount++;
    }
  }

  console.log(`\n✓ סיום סנכרון והגירה: ${successCount} החלטות נשמרו בהצלחה תחת users/guy_founder/decisions. (כשלונות: ${failCount})`);
}

if (require.main === module) {
  migrateFounderDecisions();
}

module.exports = { migrateFounderDecisions };
