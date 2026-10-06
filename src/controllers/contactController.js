/**
 * Handle contact inquiries from the website
 */
export const submitContactForm = (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, and message are required fields.'
    });
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }

  // Log or handle submission
  console.log(`[Contact Form] Submission received from ${name} <${email}>`);

  return res.status(200).json({
    success: true,
    message: 'Thank you for reaching out to ManammCare. We have received your inquiry.',
    data: {
      name,
      email,
      phone: phone || null,
      receivedAt: new Date().toISOString()
    }
  });
};
