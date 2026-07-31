import React, { useEffect, useRef } from "react";

/**
 * Real-time Audio Waveform Visualizer using Web Audio API + Canvas.
 * Connects directly to the user's active microphone MediaStream.
 */
export default function AudioWaveform({ stream, isRecording }) {
  const canvasRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);

  useEffect(() => {
    if (!isRecording || !stream) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;

      // Resume context if suspended
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Gives 32 frequency bins
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameIdRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Responsive canvas resolution
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const numBars = 28;
        const gap = 6;
        const totalGap = (numBars - 1) * gap;
        const barWidth = Math.max(4, (width - totalGap) / numBars);

        const centerIndex = Math.floor(numBars / 2);

        for (let i = 0; i < numBars; i++) {
          // Map bar index to frequency array symmetrically for visual appeal
          const distFromCenter = Math.abs(i - centerIndex);
          const dataIndex = Math.min(distFromCenter % bufferLength, bufferLength - 1);
          
          const value = dataArray[dataIndex] || 0;
          // Scale bar height dynamically between min height (6px) and max height (canvas height - 12px)
          const percent = value / 255;
          const minHeight = 8;
          const maxHeight = height - 12;
          const barHeight = Math.max(minHeight, percent * maxHeight);

          const x = i * (barWidth + gap);
          const y = (height - barHeight) / 2;

          // Vibrant rounded gradient bar
          const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(0.5, "#2563eb");
          gradient.addColorStop(1, "#1d4ed8");

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 4);
          ctx.fill();
        }
      };

      draw();
    } catch (err) {
      console.error("Error setting up Web Audio API visualizer:", err);
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {}
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
    };
  }, [stream, isRecording]);

  return (
    <div className="waveform-container">
      <canvas
        ref={canvasRef}
        width={420}
        height={70}
        className="waveform-canvas"
      />
    </div>
  );
}
