import Stripe from 'stripe';
import Org from './database/models/org';

export const stripe = new Stripe(process.env.STRIPE_SK, {
  apiVersion: '2020-08-27',
});

export const getStripeCustomerId = async (orgId: string): Promise<string | null> => {
  const org = await Org.query().findById(orgId);
  return org?.billingInfo?.stripeCustomerId || null;
};
