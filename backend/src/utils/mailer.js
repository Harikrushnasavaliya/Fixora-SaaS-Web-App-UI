import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
const appName = process.env.APP_NAME || "Fixora";
const fromEmail = process.env.APP_FROM_EMAIL || process.env.GMAIL_USER;

let gmailTransport = null;
console.log("ENV CHECK:", {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    GMAIL_USER: !!process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
});
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

export async function sendEmail({ to, subject, html, text }) {
    const mode = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();

    if (!gmailTransport) gmailTransport = buildGmailTransport();
    if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const payload = {
        to,
        from: fromEmail,
        subject,
        text: text || "",
        html: html || "",
    };

    // gmail
    if (mode === "gmail") {
        if (!gmailTransport) throw new Error("Gmail SMTP not configured");
        await gmailTransport.sendMail(payload);
        return { provider: "gmail" };
    }

    // sendgrid
    if (mode === "sendgrid") {
        if (!process.env.SENDGRID_API_KEY) throw new Error("SendGrid not configured");
        await sgMail.send({ ...payload, from: process.env.SENDGRID_FROM_EMAIL || fromEmail });
        return { provider: "sendgrid" };
    }

    // both (gmail then sendgrid)
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