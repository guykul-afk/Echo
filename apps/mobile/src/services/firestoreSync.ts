// Firestore Cloud Synchronization Service for Echo Mobile
import { firebaseConfig, initFirebase } from './firebaseAuth.js';

export function decodeFirestoreValue(val: any): any {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    return (val.arrayValue.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in val) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  return val;
}

export function decodeDoc(doc: any): any {
  const res: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc.fields || {})) {
    res[k] = decodeFirestoreValue(v);
  }
  return res;
}

export async function syncUserDecisionsFromCloud(targetUsername: string): Promise<any[]> {
  const isFounder = (
    targetUsername.toLowerCase().includes('kuleski') || 
    targetUsername.toLowerCase().includes('guy') || 
    targetUsername === 'Guy_Kuleski' || 
    targetUsername === 'guy_founder'
  );

  const usersToQuery = isFounder 
    ? ['Guy_Kuleski', 'guy_kuleski', 'guy_founder'] 
    : [targetUsername];

  const cloudDecisionsMap = new Map<string, any>();
  const fb = initFirebase();

  // Tier 1: Firestore Web SDK if initialized
  if (fb && fb.firestore) {
    try {
      const db = fb.firestore();
      for (const u of usersToQuery) {
        try {
          const snap = await db.collection('users').doc(u).collection('decisions').get();
          snap.forEach((doc: any) => {
            const data = doc.data();
            if (data && data.id && !cloudDecisionsMap.has(data.id)) {
              cloudDecisionsMap.set(data.id, data);
            }
          });
        } catch {}
      }

      if (cloudDecisionsMap.size === 0 && isFounder) {
        try {
          const rootSnap = await db.collection('decisions').get();
          rootSnap.forEach((doc: any) => {
            const data = doc.data();
            if (data && data.id && !cloudDecisionsMap.has(data.id)) {
              cloudDecisionsMap.set(data.id, data);
            }
          });
        } catch {}
      }
    } catch (sdkErr) {
      console.warn('[Firestore SDK Notice]:', sdkErr);
    }
  }

  // Tier 2: Direct Firestore REST API (CORS friendly, works everywhere)
  if (cloudDecisionsMap.size === 0) {
    for (const u of usersToQuery) {
      try {
        let url: string | null = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(u)}/decisions?key=${firebaseConfig.apiKey}&pageSize=100`;
        while (url) {
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            data.documents.forEach((d: any) => {
              const decoded = decodeDoc(d);
              if (decoded && decoded.id && !cloudDecisionsMap.has(decoded.id)) {
                cloudDecisionsMap.set(decoded.id, decoded);
              }
            });
          }
          if (data.nextPageToken) {
            url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(u)}/decisions?key=${firebaseConfig.apiKey}&pageSize=100&pageToken=${data.nextPageToken}`;
          } else {
            url = null;
          }
        }
      } catch (restErr) {
        console.warn(`[Firestore REST Notice for ${u}]:`, restErr);
      }
    }

    // Fallback to legacy root collection if empty
    if (cloudDecisionsMap.size === 0 && isFounder) {
      try {
        let url: string | null = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/decisions?key=${firebaseConfig.apiKey}&pageSize=100`;
        while (url) {
          const res = await fetch(url);
          if (!res.ok) break;
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            data.documents.forEach((d: any) => {
              const decoded = decodeDoc(d);
              if (decoded && decoded.id && !cloudDecisionsMap.has(decoded.id)) {
                cloudDecisionsMap.set(decoded.id, decoded);
              }
            });
          }
          if (data.nextPageToken) {
            url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/decisions?key=${firebaseConfig.apiKey}&pageSize=100&pageToken=${data.nextPageToken}`;
          } else {
            url = null;
          }
        }
      } catch (rootErr) {
        console.warn('[Firestore REST Root Fallback]:', rootErr);
      }
    }
  }

  // Tier 3: Local bundled DECISION_CYCLES.json fallback (guarantees offline resilience)
  if (cloudDecisionsMap.size === 0 && isFounder) {
    try {
      const res = await fetch('/DECISION_CYCLES.json');
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.decisions || []);
        list.forEach((item: any) => {
          if (item && item.id && !cloudDecisionsMap.has(item.id)) {
            cloudDecisionsMap.set(item.id, item);
          }
        });
      }
    } catch {}
  }

  // Merge with existing localStorage decisions
  const storageKey = `echo_decisions_${targetUsername}`;
  let localDecisions: any[] = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) localDecisions = JSON.parse(raw);
  } catch {}

  const mergedMap = new Map<string, any>();
  localDecisions.forEach((d: any) => { if (d && d.id) mergedMap.set(d.id, d); });
  cloudDecisionsMap.forEach((d, id) => {
    const existing = mergedMap.get(id);
    if (!existing || (d.lastSyncedAt || d.frozenAt || 0) >= (existing.lastSyncedAt || existing.frozenAt || 0)) {
      mergedMap.set(id, d);
    }
  });

  const mergedList = Array.from(mergedMap.values()).sort((a, b) => (b.frozenAt || 0) - (a.frozenAt || 0));

  // Save merged list across aliases so user immediately sees all 39+ decisions
  try {
    localStorage.setItem(storageKey, JSON.stringify(mergedList));
    if (isFounder) {
      localStorage.setItem('echo_decisions_Guy_Kuleski', JSON.stringify(mergedList));
      localStorage.setItem('echo_decisions_guy_kuleski', JSON.stringify(mergedList));
      localStorage.setItem('echo_decisions_guy_founder', JSON.stringify(mergedList));
    }
  } catch {}

  return mergedList;
}
