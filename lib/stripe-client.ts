// lib/stripe-client.ts
import { loadStripe, Stripe as StripeClient } from "@stripe/stripe-js";

// Singleton Stripe client
export const stripePromise: Promise<StripeClient | null> = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
