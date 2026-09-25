import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// Note: this module exports several middleware rather than a single default
// export like the other files here, since the auth routes need two different
// policies.

const TOO_MANY = { message: "Too many attempts. Please try again in a few minutes." };

// A blunt ceiling across all auth endpoints, to blunt credential stuffing.
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: TOO_MANY,
});

// Tighter, and keyed by IP *and* address, on the routes that cause an email to
// be sent. The IP component stops one client walking a list of addresses; the
// email component stops a shared/NAT address (or a distributed set of clients)
// from burying one person's inbox.
export const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = String(req.body?.email || "").trim().toLowerCase();
        // ipKeyGenerator normalises IPv6 to a /64 subnet; using req.ip directly
        // would let one client rotate through its own address space to reset
        // the counter.
        return `${ipKeyGenerator(req.ip)}:${email}`;
    },
    message: TOO_MANY,
});
