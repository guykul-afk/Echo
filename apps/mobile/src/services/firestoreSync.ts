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

export async function waitForAuthReady(timeoutMs = 1500): Promise<any> {
  const fb = initFirebase();
  if (!fb || !fb.auth) return null;
  if (fb.auth().currentUser) return fb.auth().currentUser;

  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(fb.auth().currentUser || null);
      }
    }, timeoutMs);

    const unsubscribe = fb.auth().onAuthStateChanged((user: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (typeof unsubscribe === 'function') unsubscribe();
        resolve(user);
      }
    });
  });
}

export async function syncUserDecisionsFromCloud(targetUsername: string): Promise<any[]> {
  if (!targetUsername) return [];

  // Wait briefly for auth state to be restored from storage if needed
  const currentUser = await waitForAuthReady(1500);

  const isFounder = (
    targetUsername === 'Guy_Kuleski' || 
    targetUsername === 'guy_founder' || 
    targetUsername === 'guy_kuleski' || 
    targetUsername.toLowerCase() === 'guykul' ||
    (currentUser?.email || '').toLowerCase() === 'guykul@gmail.com' ||
    currentUser?.uid === 'V0gUanSFkNgGzRBsa1GE3CRSpXn2'
  );

  const usersToQuery = isFounder 
    ? Array.from(new Set(['Guy_Kuleski', 'guy_kuleski', 'guy_founder', currentUser?.uid].filter(Boolean) as string[])) 
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

  // Tier 2: Direct Firestore REST API (CORS friendly, with Bearer token if present)
  if (cloudDecisionsMap.size === 0) {
    let idToken: string | null = null;
    if (fb && fb.auth && fb.auth().currentUser) {
      try {
        idToken = await fb.auth().currentUser.getIdToken();
      } catch {}
    }

    const headers: Record<string, string> = {};
    if (idToken) {
      headers['Authorization'] = `Bearer ${idToken}`;
    }

    for (const u of usersToQuery) {
      try {
        let url: string | null = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/users/${encodeURIComponent(u)}/decisions?key=${firebaseConfig.apiKey}&pageSize=100`;
        while (url) {
          const res = await fetch(url, { headers });
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
          const res = await fetch(url, { headers });
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

  if (isFounder) {
    const candidateKeys = [
      storageKey,
      'echo_decisions_Guy_Kuleski',
      'echo_decisions_guy_kuleski',
      'echo_decisions_guy_founder',
      'echo_decisions_guykul',
      'echo_decisions_GUYKUL'
    ];
    for (const k of candidateKeys) {
      try {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > localDecisions.length) {
            localDecisions = parsed;
          }
        }
      } catch {}
    }
  }

  const mergedMap = new Map<string, any>();
  localDecisions.forEach((d: any) => { if (d && d.id) mergedMap.set(d.id, d); });
  cloudDecisionsMap.forEach((d, id) => {
    const existing = mergedMap.get(id);
    if (!existing || (d.lastSyncedAt || d.frozenAt || 0) >= (existing.lastSyncedAt || existing.frozenAt || 0)) {
      mergedMap.set(id, d);
    }
  });

  const mergedList = Array.from(mergedMap.values()).sort((a, b) => (b.frozenAt || 0) - (a.frozenAt || 0));

  // Save merged list across aliases so user immediately sees all decisions
  if (mergedList.length > 0 || localDecisions.length === 0) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(mergedList));
      if (isFounder) {
        localStorage.setItem('echo_decisions_Guy_Kuleski', JSON.stringify(mergedList));
        localStorage.setItem('echo_decisions_guy_kuleski', JSON.stringify(mergedList));
        localStorage.setItem('echo_decisions_guy_founder', JSON.stringify(mergedList));
      }
    } catch {}
  }

  // Push local-only decisions to cloud so cloud is immediately synchronized!
  const unsyncedLocals = localDecisions.filter((local: any) => local && local.id && !cloudDecisionsMap.has(local.id));
  let pushedCount = 0;
  const pushErrors: string[] = [];

  if (unsyncedLocals.length > 0) {
    console.log(`[ECHO Sync]: Pushing ${unsyncedLocals.length} local-only decisions to cloud...`);
    for (const d of unsyncedLocals) {
      try {
        const ok = await saveDecisionToCloud(d, targetUsername);
        if (ok) pushedCount++;
        else pushErrors.push(`שגיאה בשמירת ${d.id}`);
      } catch (err: any) {
        pushErrors.push(`${d.id}: ${err?.message || err}`);
      }
    }
  }

  // Return full sync report (backward compatible array with extra properties)
  const result: any = mergedList;
  result.list = mergedList;
  result.pushedCount = pushedCount;
  result.pushErrors = pushErrors;
  return result;
}

export async function saveDecisionToCloud(decision: any, targetUsername: string): Promise<boolean> {
  if (!decision || !decision.id || !targetUsername) return false;
  const isFounder = (
    targetUsername === 'Guy_Kuleski' || 
    targetUsername === 'guy_founder' || 
    targetUsername === 'guy_kuleski' || 
    targetUsername.toLowerCase() === 'guykul'
  );

  // Clean payload of any undefined properties to prevent Firestore SDK exceptions
  const cleanPayload = JSON.parse(JSON.stringify({
    ...decision,
    userId: targetUsername,
    lastSyncedAt: Date.now()
  }));

  const fb = initFirebase();
  if (fb && fb.firestore) {
    const db = fb.firestore();
    let savedAny = false;
    try {
      await db.collection('users').doc(targetUsername).collection('decisions').doc(decision.id).set(cleanPayload, { merge: true });
      savedAny = true;
    } catch (err) {
      console.warn(`[Firestore save notice for ${targetUsername}]:`, err);
    }
    if (isFounder) {
      const founderTargets = ['Guy_Kuleski', 'guy_kuleski', 'guy_founder'];
      for (const target of founderTargets) {
        if (target !== targetUsername) {
          try {
            await db.collection('users').doc(target).collection('decisions').doc(decision.id).set(cleanPayload, { merge: true });
            savedAny = true;
          } catch {}
        }
      }
      try {
        await db.collection('decisions').doc(decision.id).set(cleanPayload, { merge: true });
        savedAny = true;
      } catch (err) {
        console.warn('[Firestore save notice for root /decisions]:', err);
      }
    }
    return savedAny;
  }
  return false;
}
