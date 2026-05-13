export interface ArchEvent {
  code: string;
  description: string;
  requestId: string;
  timestamp: number;
  layer: 'mfe' | 'bff' | 'domain';
}
