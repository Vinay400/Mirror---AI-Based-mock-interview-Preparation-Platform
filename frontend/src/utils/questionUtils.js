export function isCodingQuestion(q) {
  if (!q) return false;
  return String(q.type || "").toLowerCase() === "coding";
}

export function isFrameworkQuestion(q) {
  if (!q) return false;
  const evalType = String(q.evaluationType || "").toLowerCase();
  return evalType === "framework" || !!q.framework;
}

export function isJudge0Question(q) {
  return isCodingQuestion(q) && !isFrameworkQuestion(q);
}

export function getFrameworkLabel(q) {
  if (!q) return "Framework";
  const fw = String(q.framework || "").trim().toLowerCase();
  if (!fw) return "Framework";
  if (fw === "react") return "React";
  if (fw === "flutter") return "Flutter";
  if (fw === "swift") return "Swift";
  if (fw === "angular") return "Angular";
  if (fw === "vue") return "Vue";
  return fw.charAt(0).toUpperCase() + fw.slice(1);
}