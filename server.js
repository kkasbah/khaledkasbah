const express    = require('express');
const nodemailer = require('nodemailer');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Contact API ──────────────────────────────────────────────
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ ok: false, error: 'All fields are required.' });
  }

  // Email regex
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email address.' });
  }

  try {
    // ── Configure transporter ──────────────────────────────────
    // Uses env vars so credentials never live in code.
    // Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in your .env
    // or hosting environment (Heroku config vars, Railway, etc.)
    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.office365.com',
      port:   process.env.SMTP_PORT   || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'khaledkasbah@outlook.com',
        pass: process.env.SMTP_PASS || '',          // set via env var
      },
    });

    await transporter.sendMail({
      from:    `"${name}" <${process.env.SMTP_USER || 'khaledkasbah@outlook.com'}>`,
      replyTo: email,
      to:      'khaledkasbah@outlook.com',
      subject: `[Portfolio] ${subject}`,
      text:    `Name: ${name}\nEmail: ${email}\n\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#12243c;border-bottom:2px solid #b8963e;padding-bottom:8px">${subject}</h2>
          <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <hr style="border:none;border-top:1px solid #e4e0d8;margin:16px 0"/>
          <p style="white-space:pre-line">${message}</p>
        </div>
      `,
    });

    return res.json({ ok: true, message: 'Message sent successfully.' });

  } catch (err) {
    console.error('Mail error:', err.message);
    // Fallback — still acknowledge receipt so UX isn't broken
    return res.status(500).json({
      ok: false,
      error: 'Could not send email. Please reach out directly at khaledkasbah@outlook.com',
    });
  }
});

// ─── Catch-all → serve index.html ────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🌐  Server running → http://localhost:${PORT}\n`);
});
