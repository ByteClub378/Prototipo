// Registro leve de telemetria. Sem backend por enquanto: os eventos vão pro
// console, num formato pronto para futuramente ser enviado a um serviço real.

export type GameTelemetryEvent =
  | { type: "item_correct"; phase: string; level: number; item: string }
  | { type: "item_incorrect"; phase: string; level: number; item: string }
  | { type: "time_expired"; phase: string; level: number; item: string; responseTime: number }
  | { type: "level_complete"; phase: string; level: number };

export function logEvent(event: GameTelemetryEvent) {
  // eslint-disable-next-line no-console
  console.log("[telemetry]", event);
}
