import { useEffect, useRef, useState } from "react";
import "./NarrationButton.css";

type NarrationButtonProps = {
  audios: string[];
};

export function NarrationButton({ audios }: NarrationButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRequestRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      playRequestRef.current += 1;
      const audio = audioRef.current;
      if (audio) {
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
      }
      audioRef.current = null;
    };
  }, []);

  async function startAudio(audio: HTMLAudioElement) {
    const request = ++playRequestRef.current;

    try {
      await audio.play();
      if (request === playRequestRef.current && audioRef.current === audio) {
        setPlaying(true);
      }
    } catch (error) {
      if (request !== playRequestRef.current) return;
      setPlaying(false);
      audioRef.current = null;
      console.error("O navegador bloqueou a reprodução do áudio.", error);
    }
  }

  async function playFrom(index: number) {
    if (index >= audios.length) {
      setPlaying(false);
      audioRef.current = null;
      return;
    }

    const audio = new Audio(audios[index]);
    audioRef.current = audio;
    audio.onended = () => {
      void playFrom(index + 1);
    };
    audio.onerror = () => {
      playRequestRef.current += 1;
      setPlaying(false);
      audioRef.current = null;
      console.error("Não foi possível carregar o áudio da narração.");
    };

    await startAudio(audio);
  }

  async function toggleNarration() {
    const currentAudio = audioRef.current;

    if (currentAudio && !currentAudio.paused) {
      playRequestRef.current += 1;
      currentAudio.pause();
      setPlaying(false);
      return;
    }

    if (currentAudio && currentAudio.paused) {
      setPlaying(true);
      await startAudio(currentAudio);
      return;
    }

    setPlaying(true);
    void playFrom(0);
  }

  return (
    <div className="narration-button">
      <button
        type="button"
        onClick={() => void toggleNarration()}
        disabled={audios.length === 0}
        aria-pressed={playing}
      >
        <span aria-hidden="true">{playing ? "⏸" : "🔊"}</span>
        {playing ? "Pausar narração" : "Ouvir instruções"}
      </button>
    </div>
  );
}