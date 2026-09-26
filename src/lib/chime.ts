/**
 * Som curto de "pedido novo", sintetizado com Web Audio (sem arquivo de áudio).
 * Navegadores só liberam som depois de uma interação com a página: `unlockChime`
 * deve rodar num clique/tecla; antes disso `playChime` simplesmente não toca.
 */
let context: AudioContext | null = null;

export function unlockChime() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  context ??= new AudioContext();
  if (context.state === "suspended") void context.resume();
}

export function playChime() {
  if (!context || context.state !== "running") return;

  const now = context.currentTime;
  // Duas notas ascendentes (Mi → Lá), cada uma com ataque rápido e decaimento suave.
  [659.25, 880].forEach((frequency, index) => {
    const start = now + index * 0.16;
    const oscillator = context!.createOscillator();
    const gain = context!.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);

    oscillator.connect(gain).connect(context!.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.4);
  });
}
