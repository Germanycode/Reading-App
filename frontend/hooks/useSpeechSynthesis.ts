"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type SpeakOptions = {
  voiceURI?: string;
  rate?: number;
  pitch?: number;
  onEnd?: () => void;
};

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setIsSupported(typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window);
  }, []);

  useEffect(() => {
    if (!isSupported) {
      return;
    }

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported || !window.speechSynthesis.speaking) {
      return;
    }
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) {
      return;
    }
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, options: SpeakOptions = {}) => {
      if (!isSupported || !text.trim()) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      const selectedVoice = voices.find((voice) => voice.voiceURI === options.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = options.rate ?? 0.95;
      utterance.pitch = options.pitch ?? 1;
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        options.onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };
      setIsSpeaking(true);
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices]
  );

  useEffect(() => stop, [stop]);

  const sortedVoices = useMemo(
    () => [...voices].sort((first, second) => first.name.localeCompare(second.name)),
    [voices]
  );

  return { isSupported, isSpeaking, isPaused, voices: sortedVoices, speak, pause, resume, stop };
}
