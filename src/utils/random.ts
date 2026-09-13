/** Fisher-Yates: devolve uma copia; nunca altera o array original. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

/** Sorteia uma quantidade limitada, sem repetir valores. */
export function sample<T>(items: readonly T[], amount: number): T[] {
  return shuffle(items).slice(0, Math.min(amount, items.length));
}
