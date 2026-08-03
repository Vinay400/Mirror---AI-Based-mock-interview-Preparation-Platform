export function calculateQuestionAnalytics(transcript = "", durationSeconds = 0) {
  const duration = Math.max(0, Math.round(Number(durationSeconds) || 0));
  
  // Count words in transcript
  const words = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const wordsPerMinute = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;

  let pace = "Good";
  if (wordsPerMinute > 0) {
    pace = "Slow";
  } else if (wordsPerMinute < 110) {
    pace = "Relaxed";
  } else if (wordsPerMinute > 160) {
    pace = "Fast";
  } else {
    pace = "Very Slow";
  }

  return {
    duration,
    wordCount,
    wordsPerMinute,
    pace,
  };
}

export function calculateInterviewAnalytics(questionAnalyticsList = []) {
  let totalSpeakingTime = 0;
  let totalWordCount = 0;

  questionAnalyticsList.forEach((item) => {
    totalSpeakingTime += item.duration || 0;
    totalWordCount += item.wordCount || 0;
  });

  const averageWordsPerMinute =
    totalSpeakingTime > 0
      ? Math.round((totalWordCount / totalSpeakingTime) * 60)
      : 0;

  let overallPace = "Good";
  if (averageWordsPerMinute === 0) {
    overallPace = "Slow";
  } else if (averageWordsPerMinute < 110) {
    overallPace = "Slow";
  } else if (averageWordsPerMinute > 160) {
    overallPace = "Fast";
  } else {
    overallPace = "Good";
  }

  return {
    totalSpeakingTime,
    totalWordCount,
    averageWordsPerMinute,
    overallPace,
  };
}
