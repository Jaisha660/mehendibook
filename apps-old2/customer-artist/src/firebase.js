import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from "firebase/auth";

// ✅ Replace these with YOUR Firebase config
// Go to: Firebase Console → Project Settings → Your Apps → SDK Setup
const firebaseConfig = {
  apiKey: "AIzaSyAIqt5KzDgB-92uFEULH_qdVRtbbHZU_qI",
  authDomain: "mehendi-8aa61.firebaseapp.com",
  databaseURL: "https://mehendi-8aa61-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mehendi-8aa61",
  storageBucket: "mehendi-8aa61.firebasestorage.app",
  messagingSenderId: "319525361850",
  appId: "1:319525361850:web:c817b5db8e9d65dce54a83"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// ── Whole-path helpers (kept for simple/public reads, e.g. the artist directory) ──
export async function sget(key) {
  try {
    const snapshot = await get(ref(db, key));
    if (!snapshot.exists()) return null;
    return snapshot.val();
  } catch (e) {
    console.error("sget error:", key, e);
    return null;
  }
}

export async function sset(key, val) {
  try {
    await set(ref(db, key), val);
  } catch (e) {
    console.error("sset error:", key, e);
  }
}

export async function sdel(key) {
  try {
    await remove(ref(db, key));
  } catch (e) {
    console.error("sdel error:", key, e);
  }
}

// ── Per-record helpers (NEW) ──────────────────────────────────
// Collections are now stored as keyed objects, e.g. "customers/{uid}": {...}
// instead of one big array under "customers". This lets Firebase rules check
// "does auth.uid match this specific record's owner?" for every read/write.

// Returns a collection as a plain array (for filtering/mapping like before),
// each item carrying its own key as `._key` in case you ever need it.
export async function sgetCollection(path) {
  const obj = await sget(path);
  if (!obj) return [];
  return Object.entries(obj).map(([k, v]) => (v && typeof v === "object" ? { ...v, _key: k } : v));
}

// Fetch a single record by its id/key.
export async function sgetOne(path, id) {
  return sget(`${path}/${id}`);
}

// Overwrite a single record completely.
export async function ssetOne(path, id, value) {
  return sset(`${path}/${id}`, value);
}

// Merge/patch a single record without wiping its other fields.
export async function supdateOne(path, id, patch) {
  try {
    await update(ref(db, `${path}/${id}`), patch);
  } catch (e) {
    console.error("supdateOne error:", path, id, e);
  }
}

export async function sdelOne(path, id) {
  return sdel(`${path}/${id}`);
}

// ── Auth helpers ───────────────────────────────────────────────
export async function authSignUp(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user; // has .uid, .email
}

export async function authLogIn(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function authLogOut() {
  await signOut(auth);
}

export async function authResetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
