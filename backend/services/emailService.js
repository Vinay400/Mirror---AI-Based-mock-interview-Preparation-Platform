import nodemailer from "nodemailer";

const DEFAULT_CLIENT_URL = "http://localhost:5173";

const getClientUrl = () => {
    const configured = (process.env.CLIENT_URL || "").trim().replace(/\/$/, "");
    if (!configured) {
        console.warn("⚠️ WARNING: CLIENT_URL is not set. Reset links will point to localhost.");
        return DEFAULT_CLIENT_URL;
    }
    return configured;
};

let transporterPromise = null;

const createTransporter = async () => {
    if (process.env.SMTP_HOST) {
        const port = Number(process.env.SMTP_PORT) || 587;
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            requireTLS: port !== 465,
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            } : undefined,
            connectionTimeout: 10000, // 10s max connect time
            greetingTimeout: 10000,
            socketTimeout: 20000,
            pool: true,
            maxConnections: 3,
            tls: { minVersion: "TLSv1.2" },
        });
    }

    console.warn("⚠️ WARNING: SMTP_HOST is not set. Using Ethereal fallback.");
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
    });
};

const getTransporter = () => {
    if (!transporterPromise) {
        transporterPromise = createTransporter().catch((error) => {
            transporterPromise = null;
            throw error;
        });
    }
    return transporterPromise;
};

const sendMail = async ({ to, subject, html, text }) => {
    try {
        const transporter = await getTransporter();
        const info = await transporter.sendMail({
            from: process.env.MAIL_FROM || "Mock Interview <no-reply@mockinterview.local>",
            replyTo: process.env.MAIL_REPLY_TO || undefined,
            to,
            subject,
            text,
            html,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`📧 Preview URL (${to}): ${previewUrl}`);
        } else {
            console.log(`📧 Email sent to ${to} via Brevo (${info.messageId})`);
        }
        return true;
    } catch (error) {
        // Clear cached transporter so next attempt re-reads env / creates a fresh transporter instance
        transporterPromise = null;

        console.error(JSON.stringify({
            event: "email_delivery_failed",
            to,
            subject,
            code: error.code,
            message: error.message || String(error),
        }));
        return false;
    }
};

const buildEmailShell = ({ heading, body, buttonLabel, link, footer }) => `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #16181d;">
        <h1 style="font-size: 22px; margin: 0 0 16px;">${heading}</h1>
        <p style="font-size: 15px; line-height: 1.6; color: #444a55; margin: 0 0 24px;">${body}</p>
        <a href="${link}" style="display: inline-block; background: #16181d; color: #ffffff; text-decoration: none; padding: 14px 22px; border-radius: 10px; font-size: 15px; font-weight: 600;">${buttonLabel}</a>
        <p style="font-size: 13px; line-height: 1.6; color: #7a828f; margin: 24px 0 0;">
            If the button doesn't work, copy this link into your browser:<br />
            <span style="word-break: break-all;">${link}</span>
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #7a828f; margin: 24px 0 0; border-top: 1px solid #e6e8ec; padding-top: 16px;">${footer}</p>
    </div>
`;

export const sendVerificationEmail = async (user, rawToken) => {
    const link = `${getClientUrl()}/verify-email/${rawToken}`;
    const textFallback = `Welcome, ${user.name}!\n\nConfirm this address to finish setting up your account:\n${link}\n\nThis link expires in 24 hours.`;

    return sendMail({
        to: user.email,
        subject: "Verify your email address",
        text: textFallback,
        html: buildEmailShell({
            heading: `Welcome, ${user.name}!`,
            body: "Confirm this address to finish setting up your account and start practising interviews.",
            buttonLabel: "Verify my email",
            link,
            footer: "This link expires in 24 hours. If you didn't create an account, you can ignore this email.",
        }),
    });
};

export const sendPasswordResetEmail = async (user, rawToken) => {
    const link = `${getClientUrl()}/reset-password/${rawToken}`;
    const textFallback = `Hi ${user.name},\n\nWe received a request to reset your password.\nCopy and paste this link in your browser to proceed:\n${link}\n\nThis link expires in 30 minutes.`;

    return sendMail({
        to: user.email,
        subject: "Reset your password",
        text: textFallback,
        html: buildEmailShell({
            heading: "Reset your password",
            body: `Hi ${user.name}, we received a request to reset the password on your account. Choose a new one using the button below.`,
            buttonLabel: "Choose a new password",
            link,
            footer: "This link expires in 30 minutes and can only be used once. If you didn't request this, no action is needed — your password is unchanged.",
        }),
    });
};
