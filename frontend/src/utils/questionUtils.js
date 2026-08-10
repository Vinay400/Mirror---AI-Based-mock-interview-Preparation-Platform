export function isCodingQuestion(q) {
  if (!q) return false;
  const rawType = q.type ? String(q.type).toLowerCase() : "";
  if (rawType === "coding") return true;
  if (rawType === "hr") return false;

  const text = (typeof q === "string" ? q : q.question || "").toLowerCase();

  const codingKeywords = [
    "write a ",
    "write function",
    "write code",
    "write react",
    "write component",
    "write program",
    "write script",
    "write algorithm",
    "write query",
    "write sql",
    "implement ",
    "create a function",
    "create a react",
    "create a component",
    "build a component",
    "code a ",
    "code that",
    "function that",
    "passed as a prop",
    "given an array",
    "given a string",
    "return the",
    "output of",
    "functional component",
  ];

  return codingKeywords.some((kw) => text.includes(kw));
}
