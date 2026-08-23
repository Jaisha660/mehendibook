// Runs on Vercel's servers only — never sent to the browser.
// Creates a Razorpay order for either the 20% deposit or the remaining balance.
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { amount, bookingId, purpose } = req.body;
    if (!amount || !bookingId || !purpose) {
      return res.status(400).json({ error: "Missing amount, bookingId, or purpose" });
    }
    if (!["deposit", "balance"].includes(purpose)) {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount, // amount is already in paise (smallest currency unit) from the client
      currency: "INR",
      receipt: `${purpose}_${bookingId}_${Date.now()}`.slice(0, 40),
      notes: { bookingId, purpose },
    });

    return res.status(200).json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (e) {
    console.error("create-order error:", e);
    return res.status(500).json({ error: "Could not create payment order" });
  }
}
