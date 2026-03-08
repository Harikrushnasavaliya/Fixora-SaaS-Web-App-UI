import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

const appName = process.env.APP_NAME || "Fixora";
const fromEmail = process.env.APP_FROM_EMAIL || process.env.GMAIL_USER;

let gmailTransport = null;

function buildGmailTransport() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return null;

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
}

export async function sendEmail({ to, subject, html, text }) {
    const mode = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();

    // init once
    if (!gmailTransport) gmailTransport = buildGmailTransport();
    if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const payload = {
        to,
        from: fromEmail,
        subject,
        text: text || "",
        html: html || "",
    };

    // 1) Gmail only
    if (mode === "gmail") {
        if (!gmailTransport) throw new Error("Gmail SMTP not configured");
        await gmailTransport.sendMail(payload);
        return { provider: "gmail" };
    }

    // 2) SendGrid only
    if (mode === "sendgrid") {
        if (!process.env.SENDGRID_API_KEY) throw new Error("SendGrid not configured");
        await sgMail.send({ ...payload, from: process.env.SENDGRID_FROM_EMAIL || fromEmail });
        return { provider: "sendgrid" };
    }

    // 3) BOTH: try Gmail, fallback to SendGrid
    if (mode === "both") {
        try {
            if (!gmailTransport) throw new Error("Gmail SMTP not configured");
            await gmailTransport.sendMail(payload);
            return { provider: "gmail" };
        } catch (e) {
            if (!process.env.SENDGRID_API_KEY) throw e;
            await sgMail.send({ ...payload, from: process.env.SENDGRID_FROM_EMAIL || fromEmail });
            return { provider: "sendgrid" };
        }
    }

    throw new Error("Invalid EMAIL_PROVIDER");
}

export function otpEmailTemplate({ otp, minutes }) {
    return {
        subject: `${appName} Email Verification OTP`,
        html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>${appName} Verification</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This OTP expires in <b>${minutes}</b> minutes.</p>
      </div>
    `,
        text: `${appName} OTP: ${otp} (expires in ${minutes} min)`,
    };
}