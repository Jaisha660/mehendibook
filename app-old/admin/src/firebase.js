import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, remove } from "firebase/database";

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

// ── Storage helpers (replaces window.storage) ──────────────
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
