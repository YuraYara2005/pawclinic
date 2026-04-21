// Server/utils/emailService.js
const nodemailer = require('nodemailer');

// 1. Configure the "Transporter" (The email account sending the messages)
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'lonnie82@ethereal.email',
        pass: 'JR2hseSEK4nnqvB5Qp'
    }
});

// 2. Create the specific email template for appointments
const sendAppointmentConfirmation = async (clientEmail, clientName, petName, date, time) => {
  try {
    const mailOptions = {
      from: '"PawClinic Scheduling" <your_clinic_email@gmail.com>',
      to: clientEmail,
      subject: `🐾 Appointment Confirmed for ${petName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #10b981;">Appointment Confirmation</h2>
          <p>Hi ${clientName},</p>
          <p>This email is to confirm your upcoming appointment at PawClinic for <strong>${petName}</strong>.</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Date:</strong> ${date}</p>
            <p style="margin: 0; margin-top: 5px;"><strong>Time:</strong> ${time}</p>
          </div>
          <p>If you need to reschedule, please call us or reply to this email at least 24 hours in advance.</p>
          <p>Best regards,<br><strong>The PawClinic Team</strong></p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendAppointmentConfirmation };