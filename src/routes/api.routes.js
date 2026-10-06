import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.js';
import { submitContactForm } from '../controllers/contactController.js';
import { bookAppointment } from '../controllers/appointmentController.js';

const router = Router();

// Health Check
router.get('/health', getHealthStatus);

// Contact / Enquiries
router.post('/contact', submitContactForm);

// Appointments / Bookings
router.post('/appointments', bookAppointment);

export default router;
