import nodemailer from 'nodemailer';


interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  category?: string;
}

async function sendEmail(mailOptions: MailOptions): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIN_MAIL as string,
        pass: process.env.MAIL_PASS as string,
      },
    });

    // Send the email
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

export default sendEmail;
