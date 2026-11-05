// Falhas/quota/modo privado não podem interromper uma partida autenticada.
export function readStorage(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function writeStorage(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* cache opcional */ }
}
export function removeStorage(key: string) {
  try { localStorage.removeItem(key); } catch { /* cache opcional */ }
}
