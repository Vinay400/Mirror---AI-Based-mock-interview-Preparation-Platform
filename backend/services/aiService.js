import { ai } from "../config/aiConfig.js";
function buildPrompt(role, experience, difficulty, numQuestions, InterviewType, AdditionalSkills){
    return `You are a senior software engineer and technical interviewer.

Your task is to generate interview questions.

Candidate Details:
- Role: ${role}
- Experience: ${experience}
- Difficulty: ${difficulty}
- Number of Questions: ${numQuestions}
- InterviewType: ${InterviewType}
- Additional Skills: ${AdditionalSkills}

Requirements:
1. Generate exactly ${numQuestions} questions.
2. Mix the questions as follows:
   - More Technical
   - 2 Coding
   - 2 HR/Behavioral
3. Questions should match the candidate's experience level.
4. Do not repeat questions.
5. Keep the wording concise and professional.

Return ONLY valid JSON.

Expected format:

[
  {
    "id": 1,
    "type": "technical",
    "question": "Explain the Virtual DOM in React."
  }
]

Do not include markdown.
Do not include explanations.
Do not wrap the JSON in \`\`\`.
`;
}

export async function generateQuestions(role, experience, difficulty, numQuestions, InterviewType, AdditionalSkills){
    const prompt = buildPrompt(role, experience, difficulty, numQuestions, InterviewType, AdditionalSkills);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    console.log(response.text);

    return response.text;
} 

function buildEvaluationPrompt(role, experience, questionsAndAnswers) {
    return `You are a senior software engineer and technical interviewer.

Your task is to evaluate the candidate's answers based on their speech-to-text transcripts.

Candidate Details:
- Job Role: ${role}
- Experience Level: ${experience}

Questions and Raw Speech-to-Text Transcripts:
${JSON.stringify(questionsAndAnswers, null, 2)}

Instructions for Evaluation:

The candidate's responses were transcribed using Automatic Speech Recognition (ASR).
Transcripts may contain minor speech recognition or phonetic inaccuracies.

For EACH question item in questionsAndAnswers:
1. Preserve the exact "id" provided for that question. Never modify, omit, or alter the "id".
2. Return every question exactly once using its original "id".
3. Correct ONLY obvious speech recognition (ASR) mistakes using the interview question context.
4. Preserve the candidate's original intended meaning completely.
5. Do NOT invent information or add technical details the candidate did not mention.
6. Do NOT improve weak or incomplete answers beyond fixing speech recognition errors.
7. If something is unclear or you are not confident about a correction, leave the original wording unchanged.
8. Provide "transcriptConfidence" (integer from 0 to 10) representing your confidence that the corrected transcript accurately reflects the intended spoken words based on the question context and the raw transcript.
9. Evaluate the corrected answer and score it from 0 to 10.
10. Provide clear, constructive feedback.

Finally, calculate an overall score (0 to 10) for the candidate's entire performance.

Return ONLY valid JSON matching this exact schema:

{
  "questions": [
    {
      "id": "<questionId>",
      "question": "...",
      "rawTranscript": "...",
      "correctedTranscript": "...",
      "transcriptConfidence": 9,
      "feedback": "...",
      "score": 8
    }
  ],
  "overallScore": 8.0
}

Return ONLY raw JSON.
Do NOT include markdown formatting or \`\`\`json wrappers.
`;
}

export async function evaluateAnswers(role, experience, questionsAndAnswers) {
    const prompt = buildEvaluationPrompt(role, experience, questionsAndAnswers);
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    console.log("Evaluation AI Output:", response.text);
    return response.text;
}
