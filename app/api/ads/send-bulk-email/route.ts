// app/api/sendPublisherEmail/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing 'to', 'subject', or 'body' in request" },
        { status: 400 },
      );
    }

    // Configure SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: `"Paththare Ads" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: body,
    });

    return NextResponse.json({ message: "Email sent successfully" });
  } catch (err: any) {
    console.error("Error sending publisher email:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send email" },
      { status: 500 },
    );
  }
}
