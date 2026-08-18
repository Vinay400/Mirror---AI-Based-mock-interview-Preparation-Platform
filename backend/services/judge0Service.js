import axios from "axios";

const judge0 = axios.create({
  baseURL: "http://localhost:2358",
  headers: {
    "Content-Type": "application/json",
  },
});

export const submitCode = async ({
  sourceCode,
  languageId,
  stdin = "",
}) => {
  const response = await judge0.post(
    "/submissions?base64_encoded=false",
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin,
    }
  );

  return response.data;
};

export const getSubmission = async (token) => {
  const response = await judge0.get(
    `/submissions/${token}?base64_encoded=false`
  );

  return response.data;
};

export const runCode = async ({
  sourceCode,
  languageId,
  stdin = "",
}) => {
  // 1. Submit code
  const submission = await submitCode({
    sourceCode,
    languageId,
    stdin,
  });

  const token = submission.token;

  // 2. Poll Judge0 until execution finishes
  const maxAttempts = 20;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getSubmission(token);

    const statusId = result.status?.id;

    // 1 = In Queue
    // 2 = Processing
    // 3+ = Finished

    if (statusId >= 3) {
      return result;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Code execution timed out.");
};