// Efeitos sonoros curtos, sintetizados via Web Audio API — não dependem de
// arquivos de áudio externos. O controle ON/OFF de áudio (seção 18 do spec)
// fica para uma etapa futura; por enquanto os efeitos tocam sempre que possível.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  return audioCtx;
}

function playTone(
  frequencies: number[],
  durationEach: number,
  type: OscillatorType = "sine",
  gain = 0.08
) {
  const ctx = getAudioContext();
  if (!ctx) return;

  frequencies.forEach((freq, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = freq;

    const startTime = ctx.currentTime + index * durationEach;
    gainNode.gain.setValueAtTime(gain, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + durationEach);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + durationEach);
  });
}

export function playSuccessSound() {
  playTone([523.25, 659.25, 783.99], 0.12, "sine", 0.09);
}

export function playErrorSound() {
  playTone([220, 180], 0.15, "sine", 0.06);
}

export function playTimeoutSound() {
  playTone([440, 440], 0.18, "square", 0.05);
}
