



// Load environment variables from .env in development
if (process.env.NODE_ENV !== 'production') {
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not installed, ignore
  }
}

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-otp', async (req, res) => {
  const { to, otp } = req.body;
  if (!to || !otp) {
    return res.status(400).json({ error: 'Missing to or otp' });
  }

  // Use environment variables for credentials and sender
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  const sender = process.env.SENDER_EMAIL || user;

  if (!user || !pass) {
    console.error('SMTP credentials missing:', { user, pass });
    return res.status(500).json({ error: 'SMTP credentials not set in environment variables.' });
  }

  // Log request for debugging
  console.log('Sending OTP email', { to, otp, sender });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });

  try {
    await transporter.sendMail({
      from: sender,
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<p>Your OTP code is: <b>${otp}</b></p>`
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error sending OTP email:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SMTP server running on port ${PORT}`));
console.log('SMTP backend started. GMAIL_USER:', process.env.GMAIL_USER, 'SENDER_EMAIL:', process.env.SENDER_EMAIL, 'PORT:', PORT);
