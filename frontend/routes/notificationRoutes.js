import express from 'express';
import webpush from 'web-push';

const router = express.Router();

// Set VAPID keys - these should match what you're using on the frontend
const publicVapidKey = 'BPnYZ68ygMHPqSg3UDKn5aVcNBc4e53BJzSMd-txDxLNbiY1xDETIXiCr5xSAaqR2lLYQWIIEm3SwaFBk9gW6dM';
const privateVapidKey = 'Y2cC-uIbiTYHLvjC9qPl_pYj3tUXyRbopzgNYDcqnc4';

// ... existing code ... 