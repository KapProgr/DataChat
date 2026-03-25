import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    limits: {
      uploads: 10,
      queries: 50,
    },
  },
  PRO: {
    name: 'Pro',
    price: 9.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID!, // Set this after creating product in Stripe
    limits: {
      uploads: Infinity,
      queries: Infinity,
    },
  },
};
