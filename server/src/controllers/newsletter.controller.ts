import type { Request, Response } from 'express';
import { Newsletter } from '../models/Newsletter.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/v1/newsletter/subscribe
export async function subscribeNewsletter(req: Request, res: Response) {
  try {
    const { email, source = 'footer' } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existing = await Newsletter.findOne({ email: cleanEmail });

    if (existing) {
      if (existing.status === 'active') {
        return res.status(409).json({
          success: false,
          error: 'This email address is already subscribed to the Firedup Roaster Club newsletter.',
          isSubscribed: true,
        });
      }

      // Reactivate previously unsubscribed email
      existing.status = 'active';
      existing.source = source;
      existing.subscribedAt = new Date();
      await existing.save();

      return res.status(200).json({
        success: true,
        message: 'Welcome back! Your newsletter subscription has been reactivated. Use code FIREDUP15 at checkout.',
        isSubscribed: true,
      });
    }

    await Newsletter.create({
      email: cleanEmail,
      source,
      status: 'active',
      subscribedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in the Firedup Roaster Club! Use promo code FIREDUP15 for 15% off your next order.',
      isSubscribed: true,
    });
  } catch (error: any) {
    console.error('[Newsletter Controller] Subscription error:', error);
    return res.status(500).json({
      success: false,
      error: 'Unable to process newsletter subscription at this time. Please try again later.',
    });
  }
}

// GET /api/v1/newsletter/status
export async function getNewsletterStatus(req: Request, res: Response) {
  try {
    const email = req.query.email as string;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }

    const record = await Newsletter.findOne({ email: email.trim().toLowerCase() });
    return res.status(200).json({
      success: true,
      isSubscribed: record ? record.status === 'active' : false,
    });
  } catch (error: any) {
    console.error('[Newsletter Controller] Status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve newsletter status' });
  }
}

