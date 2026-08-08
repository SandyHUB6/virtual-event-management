const nodemailer = require('nodemailer');

/**
 * Sends a registration confirmation email to the attendee.
 * Uses SMTP configuration from environment variables.
 * 
 * @param {Object} user - The attendee user object.
 * @param {Object} event - The event object.
 * @returns {Promise<boolean>} Resolves to true on success.
 */
async function sendRegistrationEmail(user, event) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailFrom = process.env.EMAIL_FROM;

  // 1. Fail early if SMTP configuration is incomplete
  if (!host || !port || !emailUser || !emailPassword || !emailFrom) {
    throw new Error("Missing SMTP credentials or configuration in environment variables.");
  }

  // 2. Create the transporter on-demand
  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // Use SSL/TLS for port 465
    auth: {
      user: emailUser,
      pass: emailPassword
    }
  });

  // 3. Define content bodies
  const textContent = `Hello ${user.name},

You have successfully registered for:

${event.title}

Date: ${event.date}
Time: ${event.time}

Description:
${event.description}

We look forward to seeing you at the event.

Regards,
Virtual Event Management Team`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1a202c;">
      <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Registration Confirmed!</h2>
      <p>Hello <strong>${user.name}</strong>,</p>
      <p>You have successfully registered for the following event:</p>
      <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
        <h3 style="margin-top: 0; color: #2d3748; font-size: 1.2rem;">${event.title}</h3>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${event.date}</p>
        <p style="margin: 5px 0;"><strong>Time:</strong> ${event.time}</p>
        <p style="margin: 10px 0 0 0; color: #4a5568; font-style: italic;">${event.description}</p>
      </div>
      <p>We look forward to seeing you at the event.</p>
      <br />
      <p style="margin-bottom: 0;">Regards,</p>
      <p style="margin-top: 5px; font-weight: bold; color: #4f46e5;">Virtual Event Management Team</p>
    </div>
  `;

  // 4. Send email
  await transporter.sendMail({
    from: emailFrom,
    to: user.email,
    subject: `Event Registration Confirmation - ${event.title}`,
    text: textContent,
    html: htmlContent
  });

  return true;
}

module.exports = {
  sendRegistrationEmail
};
