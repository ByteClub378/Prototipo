import { useEffect, useMemo, useState } from "react";
import "./SpellingAnimation.css";

type SpellingAnimationProps = {
  word: string;
};

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function normalizeWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR")
    .split("")
    .filter((character) => alphabet.includes(character));
}

function SpellingAnimation({ word }: SpellingAnimationProps) {
  const letters = useMemo(() => normalizeWord(word), [word]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    if (letters.length < 2) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % letters.length);
    }, 850);

    return () => window.clearInterval(interval);
  }, [letters]);

  if (letters.length === 0) return null;

  const currentLetter = letters[currentIndex];

  return (
    <section
      className="spelling-animation"
      aria-label={`Demonstração visual das letras de ${word}`}
    >
      <div className="spelling-animation__stage">
        <div
          className={`spelling-animation__hand spelling-animation__hand--${currentLetter.toLowerCase()}`}
          aria-hidden="true"
        >
          <span className="spelling-animation__finger spelling-animation__finger--index" />
          <span className="spelling-animation__finger spelling-animation__finger--middle" />
          <span className="spelling-animation__finger spelling-animation__finger--ring" />
          <span className="spelling-animation__finger spelling-animation__finger--pinky" />
          <span className="spelling-animation__thumb" />
          <span className="spelling-animation__palm" />
        </div>
        <span
          className="spelling-animation__current"
          key={currentIndex}
          aria-live="polite"
        >
          {currentLetter}
        </span>
      </div>

      <div className="spelling-animation__letters" aria-label={letters.join(" ")}>
        {letters.map((letter, index) => (
          <span
            className={
              index === currentIndex
                ? "spelling-animation__letter is-active"
                : "spelling-animation__letter"
            }
            key={`${letter}-${index}`}
          >
            {letter}
          </span>
        ))}
      </div>
    </section>
  );
}

export default SpellingAnimation;
