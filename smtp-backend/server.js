const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/send-otp', async (req, res) => {
  const { to, otp } = req.body;
  if (!to || !otp) return res.status(400).json({ error: 'Missing to or otp' });

  // Use your Gmail app password here
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'kilanisikiru@gmail.com',
      pass: 'kwavyqwwilfmqqoj'
    }
  });

  try {
    await transporter.sendMail({
      from: 'kilanisikiru@gmail.com',
      to,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<p>Your OTP code is: <b>${otp}</b></p>`
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`SMTP server running on port ${PORT}`));
