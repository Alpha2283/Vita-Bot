const nodemailer = require('nodemailer');
const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { name, phone, budget, type, location, timeline } = req.body;
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });

    // Save to Google Sheets
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'RAW',
      resource: {
        values: [[
          timestamp,
          name || 'N/A',
          phone || 'N/A',
          budget || 'N/A',
          type || 'N/A',
          location || 'N/A',
          timeline || 'N/A',
          'New Lead'
        ]]
      }
    });

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Vita Bot" <${process.env.GMAIL_USER}>`,
      to: process.env.NOTIFICATIONS_EMAIL,
      subject: `🔷 New Lead — ${name}`,
      html: `
        <div style="font-family:'Inter',Arial,sans-serif;max-width:560px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.4);">
          <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb,#1e40af);background-size:200% 200%;padding:32px 28px;position:relative;overflow:hidden;">
            <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 50%,rgba(255,255,255,0.08) 0%,transparent 60%);"></div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;position:relative;z-index:1;">🔷 New Lead Captured</h1>
            <p style="color:#93c5fd;margin:6px 0 0;font-size:13px;position:relative;z-index:1;">Via Vita AI Chatbot</p>
          </div>
          <div style="background:linear-gradient(180deg,#0f172a,#1e293b);padding:28px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr style="border-bottom:1px solid rgba(59,130,246,0.12);"><td style="padding:14px 6px;color:#94a3b8;width:35%;font-size:13px;">Full Name</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${name}</td></tr>
              <tr style="border-bottom:1px solid rgba(59,130,246,0.12);"><td style="padding:14px 6px;color:#94a3b8;font-size:13px;">Phone Number</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${phone}</td></tr>
              <tr style="border-bottom:1px solid rgba(59,130,246,0.12);"><td style="padding:14px 6px;color:#94a3b8;font-size:13px;">Budget</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${budget}</td></tr>
              <tr style="border-bottom:1px solid rgba(59,130,246,0.12);"><td style="padding:14px 6px;color:#94a3b8;font-size:13px;">Looking To</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${type}</td></tr>
              <tr style="border-bottom:1px solid rgba(59,130,246,0.12);"><td style="padding:14px 6px;color:#94a3b8;font-size:13px;">Location</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${location}</td></tr>
              <tr><td style="padding:14px 6px;color:#94a3b8;font-size:13px;">Timeline</td><td style="padding:14px 6px;color:#f1f5f9;font-weight:700;font-size:14px;">${timeline}</td></tr>
            </table>
            <div style="margin-top:24px;padding:16px 20px;background:rgba(37,99,235,0.1);border-radius:10px;border-left:4px solid #3b82f6;">
              <p style="margin:0;color:#93c5fd;font-weight:600;font-size:13px;">⚡ Follow up within 2 hours for best conversion.</p>
            </div>
            <p style="color:#475569;font-size:11px;margin-top:20px;text-align:right;">Captured at ${timestamp} EST</p>
          </div>
        </div>
      `
    });

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Save lead error:', error);
    res.status(500).json({ error: 'Failed to save lead' });
  }
};