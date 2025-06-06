import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Define types for request body
interface ContactFormData {
  name: string;
  email: string;
  office: string;
  subject: string;
  message: string;
  targetEmail: string;
}

export async function POST(request: Request) {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = ['EMAIL_SERVER', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingEnvVars.length > 0) {
      console.error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Email configuration is incomplete. Please contact the administrator.'
        },
        { status: 500 }
      );
    }

    const body = await request.json() as ContactFormData;
    const { name, email, office, subject, message, targetEmail } = body;

    console.log('Processing contact form submission for:', email);

    // Configuration for email service
    const transportConfig = {
      host: process.env.EMAIL_SERVER,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // For Gmail - important to avoid some issues
      tls: {
        rejectUnauthorized: true
      }
    };

    console.log('Creating transporter with config:', {
      host: transportConfig.host,
      port: transportConfig.port,
      secure: transportConfig.secure,
      user: process.env.EMAIL_USER ? 'Set' : 'Not set',
      pass: process.env.EMAIL_PASSWORD ? 'Set' : 'Not set'
    });

    const transporter = nodemailer.createTransport(transportConfig);

    // Test the connection
    try {
      await transporter.verify();
      console.log('Email server connection verified');
    } catch (verifyError) {
      console.error('Failed to connect to email server:', verifyError);
      return NextResponse.json(
        {
          success: false,
          error: 'Could not connect to email server. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Office-specific email or default
    const emailTo = targetEmail || 'info@epsilonhellas.com';

    // Create email content
    const mailOptions = {
      from: `Epsilon Contact Form <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: emailTo,
      replyTo: email,
      subject: `Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Office: ${office || 'General Inquiry'}
Subject: ${subject}
Message:
${message}
      `,
      html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Office:</strong> ${office || 'General Inquiry'}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br/>')}</p>
      `,
    };

    console.log('Sending email to:', emailTo);

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send email. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}