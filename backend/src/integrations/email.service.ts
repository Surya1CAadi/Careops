import * as nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  try {
    const provider = process.env.EMAIL_PROVIDER || 'smtp';

    if (provider === 'sendgrid') {
      // SendGrid implementation
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      await sgMail.send({
        to: payload.to,
        from: payload.from || process.env.EMAIL_FROM,
        subject: payload.subject,
        html: payload.body,
      });
    } else {
      // SMTP fallback
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: payload.from || process.env.EMAIL_FROM,
        to: payload.to,
        subject: payload.subject,
        html: payload.body,
      });
    }

    console.log(`✉️  Email sent to ${payload.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
