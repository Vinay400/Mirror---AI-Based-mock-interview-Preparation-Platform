export function isCodingQuestion(q) {
    if (!q) return false;

    return String(q.type || "").toLowerCase() === "coding";
}