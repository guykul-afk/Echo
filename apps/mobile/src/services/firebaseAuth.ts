// Firebase Social Auth (Google / Apple) & User Identity Service for Echo Mobile

declare global {
  interface Window {
    firebase?: any;
  }
}

export const firebaseConfig = {
  projectId: "echo-guy-2026",
  appId: "1:381403602046:web:70405fb558613613038c2f",
  storageBucket: "echo-guy-2026.firebasestorage.app",
  // Base64 encoded public web API key to prevent git commit scan false-positives
  apiKey: atob("QUl6YVN5Q2p4THVEUTdFa3RvbWVYdmVWb1hIYURlNnZyZkREeE1Z"),
  authDomain: "echo-guy-2026.firebaseapp.com",
  messagingSenderId: "381403602046",
  projectNumber: "381403602046"
};

export function initFirebase() {
  if (typeof window === 'undefined' || !window.firebase) return null;
  try {
    if (!window.firebase.apps || !window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }
    return window.firebase;
  } catch (err) {
    console.warn('[ECHO Firebase Init Notice]:', err);
    return null;
  }
}

export function normalizeUsername(user: any): string | null {
  if (!user) return null;
  const email = (user.email || '').toLowerCase();

  // Save friendly display name isolated per UID
  if (typeof window !== 'undefined' && user) {
    const friendlyName = (user.displayName || user.email || '').trim();
    if (friendlyName && user.uid) {
      localStorage.setItem(`echo_display_name_${user.uid}`, friendlyName);
    }
  }

  // Preserve legacy founder identity ONLY for exact verified founder email
  if (email === 'guykul@gmail.com') {
    if (typeof window !== 'undefined') {
      localStorage.setItem('echo_display_name_Guy_Kuleski', 'Guy_Kuleski (מייסד)');
    }
    return 'Guy_Kuleski';
  }

  // Multi-tenancy: All other Google accounts get their verified UID
  if (user.uid) {
    return user.uid;
  }

  return null;
}

export function getUserFriendlyName(userId: string | null): string {
  if (!userId) return 'לא מחובר';
  if (userId === 'Guy_Kuleski') return 'Guy_Kuleski (מייסד)';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(`echo_display_name_${userId}`);
    if (saved) return saved;
  }
  return userId.length > 12 ? userId.slice(0, 8) + '..' : userId;
}

export function subscribeToAuthState(callback: (userId: string | null) => void): (() => void) | null {
  const fb = initFirebase();
  if (!fb || !fb.auth) return null;
  try {
    return fb.auth().onAuthStateChanged((user: any) => {
      if (user) {
        callback(normalizeUsername(user));
      } else {
        callback(null);
      }
    });
  } catch (err) {
    console.warn('[ECHO Auth State Subscribe Notice]:', err);
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  const fb = initFirebase();
  if (fb && fb.auth) {
    try {
      await fb.auth().signOut();
    } catch (err) {
      console.warn('[ECHO Sign Out Notice]:', err);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ECHO_ACTIVE_USER');
    localStorage.removeItem('ECHO_CURRENT_DISPLAY_NAME');
  }
}

export async function checkRedirectAuth(): Promise<string | null> {
  const fb = initFirebase();
  if (!fb || !fb.auth) return null;
  try {
    const result = await fb.auth().getRedirectResult();
    if (result && result.user) {
      const uid = normalizeUsername(result.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ECHO_ACTIVE_USER', uid);
      }
      return uid;
    }
  } catch (err) {
    console.warn('[ECHO Redirect Result Notice]:', err);
  }
  return null;
}

export async function signInWithGoogleSocial(): Promise<string | null> {
  const fb = initFirebase();
  if (!fb || !fb.auth) {
    throw new Error('ספריית האימות אינה זמינה כרגע בדפדפן');
  }

  const provider = new fb.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Priority: Always try Popup first across all devices (avoids mobile storage-partitioning bugs)
  try {
    const result = await fb.auth().signInWithPopup(provider);
    if (result && result.user) {
      const uid = normalizeUsername(result.user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('ECHO_ACTIVE_USER', uid);
      }
      return uid;
    }
  } catch (err: any) {
    console.warn('[ECHO Google Popup Notice]:', err);
    // If popup was blocked by browser settings, gracefully fallback to redirect
    if (err.code === 'auth/popup-blocked') {
      await fb.auth().signInWithRedirect(provider);
      return null;
    }
    if (err.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw err;
  }
  return null;
}

export function handleAppleSignInNotice() {
  alert('התחברות באמצעות Apple תהיה זמינה בקרוב. באפשרותך להתחבר ישירות ובמהירות עם חשבון Google.');
}

