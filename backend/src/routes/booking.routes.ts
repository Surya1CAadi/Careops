import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingStats
} from '../controllers/booking.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Booking CRUD
router.get('/', getAllBookings)
router.post('/', createBooking)
router.get('/stats', getBookingStats)
router.get('/:id', getBookingById)
router.put('/:id', updateBooking)
router.delete('/:id', deleteBooking)

export default router
