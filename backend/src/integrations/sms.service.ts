import twilio from 'twilio';

interface SMSPayload {
  to: string;
  message: string;
}

export const sendSMS = async (payload: SMSPayload): Promise<void> => {
  try {
    const provider = process.env.SMS_PROVIDER || 'twilio';

    if (provider === 'twilio') {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: payload.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: payload.to,
      });
    }

    console.log(`📱 SMS sent to ${payload.to}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};
