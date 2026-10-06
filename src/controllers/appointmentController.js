/**
 * Handle appointment bookings for ManammCare services
 */
export const bookAppointment = (req, res) => {
  const { patientName, contactNumber, serviceType, preferredDate, notes } = req.body;

  if (!patientName || !contactNumber || !serviceType || !preferredDate) {
    return res.status(400).json({
      success: false,
      message: 'patientName, contactNumber, serviceType, and preferredDate are required.'
    });
  }

  const bookingId = `MC-${Date.now().toString().slice(-6)}`;

  console.log(`[Appointment] New booking created: ${bookingId} for ${patientName}`);

  return res.status(201).json({
    success: true,
    message: 'Appointment booking request received successfully.',
    data: {
      bookingId,
      patientName,
      contactNumber,
      serviceType,
      preferredDate,
      notes: notes || '',
      status: 'Pending Confirmation',
      createdAt: new Date().toISOString()
    }
  });
};
