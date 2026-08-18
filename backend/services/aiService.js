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
   - 2 HR
3. Questions should match the candidate's experience level.
4. Do not repeat questions.
5. Keep questions concise, realistic, professional, and suitable for an actual technical interview.
6. Every question must have a "type" field.
7. For "coding" questions, choose the appropriate evaluationType based on the problem:
    - "algorithm" → programming problems that can be evaluated using test cases
    - "react" → React component or React-specific implementation problems
    - "frontend" → HTML/CSS/JavaScript UI implementation problems
    - "sql" → SQL/database query problems
    - "system-design" → coding/design problems that are primarily evaluated through code quality and architecture
8. Coding questions must be practical programming tasks rather than theoretical questions.

9. For coding questions, also include a "language" field indicating the recommended programming language.

10. The language must be one of:
    - "cpp"
    - "python"
    - "javascript"
    - "java"
    - "sql"
11. For "technical" questions:
   - evaluationType must be "spoken"
   - These questions will be answered verbally using the microphone.

12. For "hr" questions:
    - evaluationType must be "spoken"
    - These questions will be answered verbally using the microphone.
13. For technical and HR questions, set "language" to null.

14. For coding questions with evaluationType "algorithm", create questions that have clear inputs, expected outputs, and can be tested automatically.

15. For coding questions with evaluationType "react", create questions that can be evaluated by rendering/testing the React component.

16. For coding questions with evaluationType "frontend", create questions that can be evaluated through DOM/UI behavior.

17. For coding questions with evaluationType "sql", create questions that can be evaluated against a test database.

18. For coding questions with evaluationType "system-design", focus on implementation quality, architecture, and reasoning rather than simple input/output test cases.
    
Return ONLY valid JSON.

Expected format:

[
  {
    "id": 1,
    "type": "technical",
    "evaluationType": "spoken",
    "language": null,
    "question": "Explain the Virtual DOM in React."
  },
  {
    "id": 2,
    "type": "coding",
    "evaluationType": "algorithm",
    "language": "cpp",
    "question": "Implement a function to reverse a singly linked list."
  },
  {
    "id": 3,
    "type": "coding",
    "evaluationType": "react",
    "language": "javascript",
    "question": "Create a React component that accepts name and age as props and displays them."
  },
  {
    "id": 4,
    "type": "hr",
    "evaluationType": "spoken",
    "language": null,
    "question": "Tell me about a challenging project you worked on."
  }
]


Do not include markdown.
Do not include explanations.
Do not wrap the JSON in code fences.
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
    return `You are a senior software engineer and expert technical interviewer.

Your task is to evaluate the candidate's answers based on their speech-to-text transcripts and return a comprehensive evaluation JSON containing Technical Evaluation and Language & Communication Evaluation.

Candidate Details:
- Job Role: ${role}
- Experience Level: ${experience}

Questions and Raw Speech-to-Text Transcripts:
${JSON.stringify(questionsAndAnswers, null, 2)}

Instructions for Evaluation:

The candidate's responses were transcribed using Automatic Speech Recognition (ASR).
Transcripts may contain minor speech recognition or phonetic inaccuracies.

SECTION 1 — Technical Evaluation Requirements:
- "overallScore": Overall interview score (0 to 100).
- "technicalScore": Evaluate technical knowledge demonstrated across all answers (0 to 100).
- "problemSolvingScore": Evaluate reasoning, logical thinking, technical approach, and explanation quality (0 to 100).
- "recommendation": Return EXACTLY ONE of: "Strong Hire", "Hire", "Borderline", "Needs Improvement".
- "summary": A concise paragraph summarizing overall interview performance (mention strongest area, weakest area, and overall performance in approximately 4 to 6 sentences).
- "strengths": 3 to 6 concise bullet points highlighting candidate technical strengths.
- "improvementAreas": 3 to 6 actionable improvements.
- "recommendedTopics": Concrete study recommendations based on weak areas (concrete technical topics, avoid generic advice).

SPECIAL INSTRUCTION FOR CODING QUESTIONS:
- For any question where "userCode" is provided, evaluate the code correctness, structure, logic, and implementation.
- If a verbal explanation transcript ("rawTranscript") is ALSO provided alongside "userCode", evaluate both together.
- If no verbal explanation is provided but "userCode" is valid, evaluate the code logic. Do NOT penalize the technical score or complain in "feedback" about a missing verbal explanation if valid code is submitted!

SECTION 2 — Language & Communication Evaluation Requirements:
Evaluate transcript text ONLY. Do NOT evaluate voice confidence, tone, pronunciation, speaking speed, or pauses.
You MUST include an overall "communication" object containing all 6 properties:
- "grammar": Grammar accuracy score (0 to 100 based on candidate transcript).
- "clarity": Clarity of expression score (0 to 100).
- "structure": Logical explanation structure score (0 to 100).
- "completeness": Completeness of answers score (0 to 100).
- "vocabulary": Vocabulary usage score (0 to 100).
- "summary": Short communication summary explaining what was good and what can improve.

For EACH question item in questionsAndAnswers:
1. "id": Return the exact same question ID received in the input. Never modify, omit, or alter it.
2. "question": The original question text.
3. "type": must be exactly one of: "Technical", "HR", "Coding".
4. "topic": Classify each question into a category (e.g., React, JavaScript, Node.js, Express, MongoDB, SQL, DBMS, OOP, DSA, HR, Behavioral, System Design).
5. "rawTranscript": The raw transcript provided.
6. "correctedTranscript": Correct ONLY obvious ASR / transcription mistakes using question context. Do NOT improve weak answers or invent information. Preserve candidate's intended meaning.
7. "transcriptConfidence": Integer between 0 and 10 indicating confidence that the corrected transcript accurately reflects the intended spoken answer.
8. "score": Technical score from 0 to 100 for the individual answer.
9. "feedback": Concise, constructive feedback mentioning what was good, what was missing, and how to improve.
10. "idealAnswer": Concise model answer that would score highly for the question. Keep educational, interview-focused, and concise.
11. "missedConcepts": Array of important concepts that were missing (or empty array [] if none missing).
12. "communication": Question-level communication metrics object containing all 5 properties: "grammar" (0-100), "clarity" (0-100), "structure" (0-100), "completeness" (0-100), "vocabulary" (0-100). Note: For Coding questions without a verbal transcript, assign high/neutral communication scores (e.g., 90-100) based on code clarity rather than 0.

Output Requirements:
- Return ONLY valid JSON.
- Do NOT omit any required communication metric fields.
- Do NOT include markdown code block wrappers (e.g. \`\`\`json).
- Do NOT include explanations outside the JSON.
- Return every question exactly once.
- Preserve question IDs exactly as received.

Expected JSON Structure:
{
  "overallScore": 86,
  "technicalScore": 89,
  "problemSolvingScore": 84,
  "recommendation": "Hire",
  "summary": "...",
  "strengths": [
    "Strong React fundamentals",
    "Clear technical explanations"
  ],
  "improvementAreas": [
    "Provide deeper explanations",
    "Improve database knowledge"
  ],
  "recommendedTopics": [
    "Closures",
    "Event Loop"
  ],
  "communication": {
    "grammar": 90,
    "clarity": 82,
    "structure": 88,
    "completeness": 84,
    "vocabulary": 86,
    "summary": "Candidate communicated technical concepts with strong clarity and grammar..."
  },
  "questions": [
    {
      "id": "...",
      "question": "...",
      "type": "...",
      "topic": "React",
      "rawTranscript": "...",
      "correctedTranscript": "...",
      "transcriptConfidence": 9,
      "score": 85,
      "feedback": "...",
      "idealAnswer": "...",
      "missedConcepts": [
        "Diffing algorithm",
        "Reconciliation"
      ],
      "communication": {
        "grammar": 90,
        "clarity": 82,
        "structure": 88,
        "completeness": 84,
        "vocabulary": 86
      }
    }
  ]
}
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
