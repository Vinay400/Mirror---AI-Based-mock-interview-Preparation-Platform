export const assertMailConfig = () => {
    if (process.env.NODE_ENV !== "production") return;

    const required = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"];
    const missing = required.filter((k) => !process.env[k]?.trim());

    if (missing.length) {
        throw new Error(`[Mail Guard] Refusing to start in production: missing ${missing.join(", ")}.`);
    }
};
