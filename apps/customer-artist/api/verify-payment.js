// Runs on Vercel's servers only. This is the ONLY place a booking's payment
// status is ever written — never the browser, never a client-side write. It
// verifies Razorpay's cryptographic signature (proving the payment is real,
// not spoofed) before touching the database, and uses the Firebase Admin SDK,
// which bypasses your security rules entirely — appropriate here because this
// code is trusted server code, not something a visitor's browser can run.
import crypto from "crypto";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId, purpose } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingId || !purpose) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Recompute the signature ourselves from the order/payment IDs + our secret key.
    // If it doesn't match, this request did not genuinely come from Razorpay.
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");
    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    const db = admin.database();
    const bookingRef = db.ref(`bookings/${bookingId}`);
    const snap = await bookingRef.once("value");
    const booking = snap.val();
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    if (purpose === "deposit") {
      await bookingRef.update({
        depositPaid: true,
        depositPaymentId: razorpay_payment_id,
        status: "pending", // now becomes visible to the artist
      });
      // Reveal this booking to the artist for the first time — created here,
      // server-side, specifically so a customer can never fake this reveal
      // by writing directly to the database themselves.
      await db.ref(`requests/${bookingId}`).set({ ...booking, status: "pending" });
      await db.ref(`bookingsByUser/${booking.artistId}/${bookingId}`).set(true);
      await db.ref(`requestsByArtist/${booking.artistId}/${bookingId}`).set(true);
    } else if (purpose === "balance") {
      const commissionRate = 0.10; // platform's 10% cut
      const platformCommission = Math.round(Number(booking.price) * commissionRate);
      const artistPayout = Number(booking.price) - platformCommission;
      await bookingRef.update({
        balancePaid: true,
        balancePaymentId: razorpay_payment_id,
        platformCommission,
        artistPayout,
        payoutStatus: "pending", // Admin sees this and pays the artist manually
      });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("verify-payment error:", e);
    return res.status(500).json({ error: "Payment verification failed" });
  }
}
