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

Your task is to evaluate the candidate's answers.

Candidate Details:
- Job Role: ${role}
- Experience Level: ${experience}

Questions and Raw Speech-to-Text Transcripts:
${JSON.stringify(questionsAndAnswers, null, 2)}

Instructions:

The answers were generated using automatic speech recognition (ASR).
They may contain transcription mistakes.

For EACH answer:

1. Correct ONLY obvious speech recognition mistakes.
2. Use the interview question as context.
3. Do NOT invent information.
4. Do NOT improve weak answers.
5. Preserve the candidate's original meaning.
6. If something is unclear, leave it unchanged.
7. 6. If you are not reasonably confident about a correction, leave the original wording.

After correcting the transcript:

- Evaluate the answer.
- Score from 0-10.
- Give concise feedback.
- Provide "transcriptConfidence" (0-10), representing your confidence that the corrected transcript accurately reflects the intended spoken words based on the question context and the raw transcript.

Finally return ONLY valid JSON.

{
  "questions":[
    {
      "question":"...",
      "rawTranscript":"...",
      "correctedTranscript":"...",
      "transcriptConfidence":9,
      "feedback":"...",
      "score":8
    }
  ],
  "overallScore":7.8
}

Return ONLY JSON.
Do NOT use markdown.
Do NOT wrap in \`\`\`.
`;
}

export async function evaluateAnswers(role, experience, questionsAndAnswers) {
    const prompt = buildEvaluationPrompt(role, experience, questionsAndAnswers);
    const response = await ai.models.generateContent({
        model: "gemini-3-flash",
        contents: prompt,
    });
    console.log("Evaluation AI Output:", response.text);
    return response.text;
}
