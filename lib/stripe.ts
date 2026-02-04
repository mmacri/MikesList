import Stripe from "stripe";
import { monetizationEnabled } from "./config";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!monetizationEnabled) {
    return null;
  }
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!stripe) {
    stripe = new Stripe(secret, {
      apiVersion: "2023-10-16"
    });
  }
  return stripe;
}
