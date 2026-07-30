import sdk from "microsoft-cognitiveservices-speech-sdk";
import axios from "axios";
import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import Interview from "../models/Interview.js";

const speechConfig = sdk.SpeechConfig.fromSubscription(
  process.env.AZURE_SPEECH_KEY,
  process.env.AZURE_SPEECH_REGION
);

speechConfig.speechRecognitionLanguage = "en-IN";

const downloadAudio = async (audioUrl, interviewId, questionId) => {
  const fileName = `${interviewId}-${questionId}-${crypto.randomUUID()}.webm`;
  const filePath = path.join(os.tmpdir(), fileName);

  console.log("\n========== DOWNLOADING AUDIO ==========");
  console.log("URL:", audioUrl);

  const response = await axios({
    url: audioUrl,
    method: "GET",
    responseType: "stream",
  });

  if (response.status !== 200) {
    throw new Error("Failed to download audio.");
  }

  const writer = fs.createWriteStream(filePath);

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  console.log("Downloaded:", filePath);
  console.log("WebM Size:", fs.statSync(filePath).size, "bytes");

  return filePath;
};

const convertToWav = async (webmPath) => {
  const wavPath = webmPath.replace(".webm", ".wav");

  console.log("\n========== CONVERTING TO WAV ==========");

  return new Promise((resolve, reject) => {
    ffmpeg(webmPath)
      .audioCodec("pcm_s16le")
      .audioChannels(1)
      .audioFrequency(16000)
      .format("wav")

      .on("start", (cmd) => {
        console.log("FFmpeg Command:");
        console.log(cmd);
      })

      .on("end", () => {
        console.log("WAV conversion completed.");
        console.log("WAV Path:", wavPath);
        console.log("WAV Size:", fs.statSync(wavPath).size, "bytes");

        ffmpeg.ffprobe(wavPath, (err, metadata) => {
          if (!err) {
            console.log("========== WAV METADATA ==========");
            console.log(metadata.format);
          }
        });

        resolve(wavPath);
      })

      .on("error", (err) => {
        console.error("FFmpeg Error:", err);
        reject(err);
      })

      .save(wavPath);
  });
};

export const transcribeAudio = async (
  audioUrl,
  interviewId,
  questionId
) => {
  const webmPath = await downloadAudio(
    audioUrl,
    interviewId,
    questionId
  );

  const wavPath = await convertToWav(webmPath);

  console.log("\n========== FILE LOCATIONS ==========");
  console.log("WEBM:", webmPath);
  console.log("WAV :", wavPath);

  console.log("\nPLAY THIS WAV FILE MANUALLY!");
  console.log("If the WAV is incomplete, the problem is before Azure.");
  console.log("If the WAV is complete, Azure is the problem.");

  const audioConfig = sdk.AudioConfig.fromWavFileInput(
    fs.readFileSync(wavPath)
  );

  const recognizer = new sdk.SpeechRecognizer(
    speechConfig,
    audioConfig
  );

const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);

phraseList.addPhrase("JavaScript");
phraseList.addPhrase("React");
phraseList.addPhrase("Node.js");
phraseList.addPhrase("MongoDB");
phraseList.addPhrase("Express");
phraseList.addPhrase("let");
phraseList.addPhrase("const");
phraseList.addPhrase("var");
phraseList.addPhrase("block scope");
phraseList.addPhrase("function scope");
phraseList.addPhrase("hoisting");
phraseList.addPhrase("closure");
  const transcript = await recognizeSpeech(recognizer);

  console.log("\n========== FINAL TRANSCRIPT ==========");
  console.log(transcript);

  const interview = await Interview.findById(interviewId);

  const question = interview.questions.id(questionId);

  if (!question) {
    throw new Error("Question not found");
  }

  question.transcriptRaw = transcript;

  await interview.save();

  // KEEP FILES DURING DEBUGGING
  // await deleteFile(webmPath);
  // await deleteFile(wavPath);

  console.log("\nTemporary files NOT deleted for debugging.");

  return transcript;
};

const recognizeSpeech = (recognizer) => {
  return new Promise((resolve, reject) => {
    let transcript = "";

    recognizer.sessionStarted = () => {
      console.log("\n========== AZURE SESSION STARTED ==========");
    };

    recognizer.sessionStopped = () => {
      console.log("\n========== AZURE SESSION STOPPED ==========");
    };

    recognizer.speechStartDetected = () => {
      console.log("Speech Started");
    };

    recognizer.speechEndDetected = () => {
      console.log("Speech End Detected");
    };

    recognizer.recognizing = (_, e) => {
      console.log("Recognizing:", e.result.text);
    };

    recognizer.recognized = (_, e) => {
      console.log("\nRecognized Event");
      console.log("Reason:", e.result.reason);
      console.log("Text:", e.result.text);
      console.log("Duration:", e.result.duration);
      console.log("Offset:", e.result.offset);

      if (e.result.reason === sdk.ResultReason.RecognizedSpeech) {
        transcript += e.result.text + " ";
      }
    };

recognizer.canceled = (_, e) => {
    console.log("Cancelled:", e.reason, e.errorCode);

    if (e.errorCode !== sdk.CancellationErrorCode.NoError) {
        reject(new Error(e.errorDetails || "Recognition cancelled"));
    }
};

    recognizer.startContinuousRecognitionAsync();

    recognizer.sessionStopped = () => {
      recognizer.stopContinuousRecognitionAsync(() => {
        recognizer.close();

        resolve(transcript.trim());
      });
    };
  });
};

const deleteFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
  } catch (err) {
    console.error("Delete Error:", err);
  }
};