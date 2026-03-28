// OpenLIT normalization layer
// All OpenLIT types are contained here — never leak outside this module

export interface NormalizedEvent {
  sessionId: string;
  orgId: string;
  step: number;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

export function normalize(_raw: unknown): NormalizedEvent {
  throw new Error("Not implemented");
}
