import { useEffect, useRef, useState } from "react";
import "./InstructionAudio.css";

interface InstructionAudioProps {
  text: string;
  audioSrc?: string;
}

function InstructionAudioPlayer({
  text,
  audioSrc,
}: InstructionAudioProps) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const requestRef = useRef(0);

  const canSpeak =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  useEffect(() => {
    return () => {
      requestRef.current += 1;

      const audio = audioRef.current;

      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }

      audioRef.current = null;

      const speech = speechRef.current;

      if (speech) {
        speech.onend = null;
        speech.onerror = null;
        window.speechSynthesis.cancel();
      }

      speechRef.current = null;
    };
  }, [text, audioSrc]);

  function stop() {
    requestRef.current += 1;
    audioRef.current?.pause();

    if (speechRef.current) {
      window.speechSynthesis.cancel();
    }

    setPlaying(false);
  }

  function speak(request: number) {
    if (request !== requestRef.current) return;

    if (!canSpeak) {
      setPlaying(false);
      setError("Não foi possível reproduzir. Leia as instruções na tela.");
      return;
    }

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "pt-BR";
    speech.rate = 0.9;
    speech.pitch = 1.15;

    const voices = window.speechSynthesis.getVoices();

    const voice =
      voices.find(
        (item) =>
          item.lang.toLowerCase().replace("_", "-") === "pt-br",
      ) ??
      voices.find((item) => item.lang.toLowerCase().startsWith("pt"));

    if (voice) speech.voice = voice;

    speech.onend = () => {
      if (request === requestRef.current) {
        setPlaying(false);
      }
    };

    speech.onerror = () => {
      if (request === requestRef.current) {
        setPlaying(false);
        setError("Não foi possível reproduzir. Leia as instruções na tela.");
      }
    };

    speechRef.current = speech;

    try {
      window.speechSynthesis.speak(speech);
    } catch {
      setPlaying(false);
      setError("Não foi possível reproduzir. Leia as instruções na tela.");
    }
  }

  async function toggle() {
    if (playing) {
      stop();
      return;
    }

    setError("");
    setPlaying(true);

    const request = ++requestRef.current;

    if (!audioSrc) {
      speak(request);
      return;
    }

    const audio = new Audio(audioSrc);
    audioRef.current = audio;

    let fellBack = false;

    const fallback = () => {
      if (fellBack || request !== requestRef.current) return;

      fellBack = true;
      audio.pause();
      speak(request);
    };

    audio.onended = () => {
      if (request === requestRef.current) {
        setPlaying(false);
      }
    };

    audio.onerror = fallback;

    try {
      await audio.play();
    } catch {
      fallback();
    }
  }

  return (
    <div className="instruction-audio">
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={!audioSrc && !canSpeak}
        aria-label={
          playing
            ? "Parar narração das instruções"
            : "Ouvir instruções"
        }
      >
        <span aria-hidden="true">
          {playing ? "⏹️" : "🔊"}
        </span>

        {playing ? "Parar narração" : "Ouvir instruções"}
      </button>

      <span role="status">
        {error ||
          (!audioSrc && !canSpeak
            ? "A narração não está disponível neste navegador."
            : "")}
      </span>
    </div>
  );
}

export default function InstructionAudio(props: InstructionAudioProps) {
  return (
    <InstructionAudioPlayer
      key={JSON.stringify([props.text, props.audioSrc])}
      {...props}
    />
  );
}
