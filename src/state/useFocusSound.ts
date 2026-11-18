import { useEffect, useRef, useState } from "react";

export type FocusSound = "brown" | "hum" | "pulse";

/** Audio starts only from the user's sound button and stops when the view closes. */
export function useFocusSound() {
  const context = useRef<AudioContext | null>(null);
  const [sound, setSound] = useState<FocusSound | null>(null);
  const [error, setError] = useState("");
  const stop = () => {
    void context.current?.close().catch(() => {});
    context.current = null;
    setSound(null);
  };
  useEffect(
    () => () => {
      void context.current?.close().catch(() => {});
    },
    [],
  );
  const play = async (next: FocusSound) => {
    if (sound === next) {
      stop();
      return;
    }
    stop();
    setError("");
    try {
      const audio = new AudioContext();
      context.current = audio;
      await audio.resume();
      if (context.current !== audio) return;
      const gain = audio.createGain();
      gain.gain.value = 0.035;
      gain.connect(audio.destination);
      if (next === "brown") {
        const buffer = audio.createBuffer(
          1,
          audio.sampleRate * 4,
          audio.sampleRate,
        );
        const data = buffer.getChannelData(0);
        let previous = 0;
        for (let index = 0; index < data.length; index++) {
          previous = (previous + 0.02 * (Math.random() * 2 - 1)) / 1.02;
          data[index] = previous * 3.5;
        }
        const source = audio.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(gain);
        source.start();
      } else {
        const oscillator = audio.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = next === "hum" ? 140 : 220;
        oscillator.connect(gain);
        oscillator.start();
        if (next === "pulse") {
          const modulation = audio.createOscillator();
          const depth = audio.createGain();
          modulation.frequency.value = 0.2;
          depth.gain.value = 0.012;
          modulation.connect(depth);
          depth.connect(gain.gain);
          modulation.start();
        }
      }
      setSound(next);
    } catch {
      stop();
      setError(
        "Audio could not start in this browser. You can continue in silence.",
      );
    }
  };
  return { sound, play, stop, error };
}
