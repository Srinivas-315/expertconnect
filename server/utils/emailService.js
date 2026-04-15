const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ── App URL — fallback to production URL if CLIENT_URL not set ─
const APP_URL = process.env.CLIENT_URL || 'https://expertconnect-93ye.vercel.app';

// ── Shared brand colors ─────────────────────────────────────
const PRIMARY = '#2563EB';   // blue-600
const DARK    = '#1E293B';   // slate-800
const LIGHT   = '#F8FAFC';   // slate-50

// ── Base HTML wrapper ───────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ExpertConnect</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,${PRIMARY} 0%,#4F46E5 100%);padding:32px 40px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:8px 16px;margin-bottom:12px;">
              <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">EC ExpertConnect</span>
            </div>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:${LIGHT};padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              © ${new Date().getFullYear()} ExpertConnect · Connecting experts with people who need them
            </p>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
              You received this email because you have an account on ExpertConnect.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Reusable button ─────────────────────────────────────────
const btn = (text, href) =>
  `<a href="${href}" style="display:inline-block;background:${PRIMARY};color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;margin:20px 0;">${text}</a>`;

// ── Info box ────────────────────────────────────────────────
const infoBox = (rows) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:0;margin:20px 0;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding:12px 20px;border-bottom:1px solid #e2e8f0;">
          <span style="color:#64748b;font-size:13px;">${label}</span><br/>
          <span style="color:#1e293b;font-size:15px;font-weight:600;">${value}</span>
        </td>
      </tr>`).join('')}
  </table>`;

// ═══════════════════════════════════════════════════════════
// 1. BOOKING CONFIRMATION — sent to CLIENT after booking
// ═══════════════════════════════════════════════════════════
const sendBookingConfirmation = async ({ clientEmail, clientName, expertName, category, scheduledDate, bookingId }) => {
  const html = baseTemplate(`
    <h1 style="color:${DARK};font-size:26px;margin:0 0 8px;">Booking Confirmed! 🎉</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi <strong>${clientName}</strong>, your booking request has been submitted successfully.
      The expert will review and confirm shortly.
    </p>

    ${infoBox([
      ['Expert', expertName],
      ['Category', category],
      ['Scheduled Date', new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
      ['Booking ID', `#${bookingId.toString().slice(-8).toUpperCase()}`],
      ['Status', '⏳ Pending Expert Confirmation'],
    ])}

    <p style="color:#475569;font-size:14px;">You'll receive another email when the expert accepts or declines.</p>
    ${btn('View Booking', `${APP_URL}/dashboard`)}
  `);

  return resend.emails.send({
    from: 'ExpertConnect <onboarding@resend.dev>',
    to: clientEmail,
    subject: `✅ Booking Confirmed — ${expertName} | ExpertConnect`,
    html,
  });
};

// ═══════════════════════════════════════════════════════════
// 2. NEW BOOKING ALERT — sent to EXPERT when someone books them
// ═══════════════════════════════════════════════════════════
const sendNewBookingAlert = async ({ expertEmail, expertName, clientName, category, scheduledDate, bookingId }) => {
  const html = baseTemplate(`
    <h1 style="color:${DARK};font-size:26px;margin:0 0 8px;">New Booking Request! 📬</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi <strong>${expertName}</strong>, someone wants to book a session with you!
    </p>

    ${infoBox([
      ['Client', clientName],
      ['Category Requested', category],
      ['Requested Date', new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
      ['Booking ID', `#${bookingId.toString().slice(-8).toUpperCase()}`],
    ])}

    <p style="color:#475569;font-size:14px;font-weight:600;">⚡ Please respond within 24 hours to keep your response rate high.</p>
    ${btn('Accept or Decline →', `${APP_URL}/dashboard`)}
  `);

  return resend.emails.send({
    from: 'ExpertConnect <onboarding@resend.dev>',
    to: expertEmail,
    subject: `📬 New Booking Request from ${clientName} | ExpertConnect`,
    html,
  });
};

// ═══════════════════════════════════════════════════════════
// 3. BOOKING ACCEPTED — sent to CLIENT
// ═══════════════════════════════════════════════════════════
const sendBookingAccepted = async ({ clientEmail, clientName, expertName, category, scheduledDate, bookingId }) => {
  const html = baseTemplate(`
    <h1 style="color:#16a34a;font-size:26px;margin:0 0 8px;">Booking Accepted! ✅</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Great news, <strong>${clientName}</strong>! <strong>${expertName}</strong> has accepted your booking request.
      Get ready for your session!
    </p>

    ${infoBox([
      ['Expert', expertName],
      ['Category', category],
      ['Session Date', new Date(scheduledDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
      ['Booking ID', `#${bookingId.toString().slice(-8).toUpperCase()}`],
      ['Status', '✅ Confirmed'],
    ])}

    <p style="color:#475569;font-size:14px;">You can now chat with your expert directly on ExpertConnect.</p>
    ${btn('Open Chat →', `${APP_URL}/dashboard`)}
  `);

  return resend.emails.send({
    from: 'ExpertConnect <onboarding@resend.dev>',
    to: clientEmail,
    subject: `✅ Your booking with ${expertName} is confirmed! | ExpertConnect`,
    html,
  });
};

// ═══════════════════════════════════════════════════════════
// 4. BOOKING REJECTED — sent to CLIENT
// ═══════════════════════════════════════════════════════════
const sendBookingRejected = async ({ clientEmail, clientName, expertName, category }) => {
  const html = baseTemplate(`
    <h1 style="color:#dc2626;font-size:26px;margin:0 0 8px;">Booking Declined 😔</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi <strong>${clientName}</strong>, unfortunately <strong>${expertName}</strong> is unable to accept your booking
      for <strong>${category}</strong> at this time.
    </p>

    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="color:#991b1b;margin:0;font-size:14px;">
        💡 <strong>Don't worry!</strong> There are many other verified experts available in the same category.
      </p>
    </div>

    ${btn('Find Another Expert →', `${APP_URL}/experts?category=${encodeURIComponent(category)}`)}
  `);

  return resend.emails.send({
    from: 'ExpertConnect <onboarding@resend.dev>',
    to: clientEmail,
    subject: `Booking Update from ${expertName} | ExpertConnect`,
    html,
  });
};

// ═══════════════════════════════════════════════════════════
// 5. PAYMENT SUCCESS — sent to CLIENT
// ═══════════════════════════════════════════════════════════
const sendPaymentSuccess = async ({ clientEmail, clientName, expertName, amount, bookingId, transactionId }) => {
  const html = baseTemplate(`
    <h1 style="color:${DARK};font-size:26px;margin:0 0 8px;">Payment Successful! 💳</h1>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Hi <strong>${clientName}</strong>, your payment has been received. Here's your receipt:
    </p>

    ${infoBox([
      ['Expert', expertName],
      ['Amount Paid', `₹${amount}`],
      ['Booking ID', `#${bookingId.toString().slice(-8).toUpperCase()}`],
      ['Transaction ID', transactionId || 'N/A'],
      ['Date', new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })],
      ['Status', '💚 Payment Successful'],
    ])}

    <p style="color:#475569;font-size:14px;">A copy of this receipt has been saved to your account.</p>
    ${btn('View Dashboard', `${APP_URL}/dashboard`)}
  `);

  return resend.emails.send({
    from: 'ExpertConnect <onboarding@resend.dev>',
    to: clientEmail,
    subject: `💳 Payment Receipt — ₹${amount} | ExpertConnect`,
    html,
  });
};

// ── Safe wrapper (don't crash app if email fails) ────────────
const sendEmail = async (fn, ...args) => {
  try {
    await fn(...args);
  } catch (err) {
    console.error('📧 Email error (non-fatal):', err.message);
  }
};

module.exports = {
  sendBookingConfirmation,
  sendNewBookingAlert,
  sendBookingAccepted,
  sendBookingRejected,
  sendPaymentSuccess,
  sendEmail,
};
