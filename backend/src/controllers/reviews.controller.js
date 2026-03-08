import { Review } from "../models/Reviews.js";
import { Booking } from "../models/Booking.js";

export async function createReview(req, res) {
  try {
    const customer_id = req.user.id;
    const { booking_id, provider_id, rating, comment } = req.body;

    if (!booking_id || !provider_id || !rating) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const booking = await Booking.findById(booking_id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // customer must own booking, booking should be completed
    if (String(booking.customer_id) !== customer_id) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (booking.status !== "completed") {
      return res.status(400).json({ message: "Booking not completed yet" });
    }

    const review = await Review.create({
      booking_id,
      customer_id,
      provider_id,
      rating: Number(rating),
      comment,
    });

    return res.status(201).json(review);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function getProviderReviews(req, res) {
  try {
    const { providerId } = req.params;
    const reviews = await Review.find({ provider_id: providerId }).sort({ created_at: -1 }).lean();
    return res.json(reviews);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}