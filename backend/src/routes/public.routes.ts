import { Router } from 'express';

const router = Router();

// Public routes (no authentication)

// @route   POST /api/public/contact
// @desc    Submit contact form
// @access  Public
router.post('/contact', async (req, res) => {
  res.json({ success: true, message: 'Contact form submitted' });
});

// @route   GET /api/public/booking/:workspaceId
// @desc    Get booking page details
// @access  Public
router.get('/booking/:workspaceId', async (req, res) => {
  res.json({ success: true, data: {} });
});

// @route   POST /api/public/booking
// @desc    Create booking
// @access  Public
router.post('/booking', async (req, res) => {
  res.json({ success: true, data: {} });
});

// @route   GET /api/public/form/:formId
// @desc    Get form details
// @access  Public
router.get('/form/:formId', async (req, res) => {
  res.json({ success: true, data: {} });
});

// @route   POST /api/public/form/:formId/submit
// @desc    Submit form
// @access  Public
router.post('/form/:formId/submit', async (req, res) => {
  res.json({ success: true, message: 'Form submitted' });
});

export default router;
