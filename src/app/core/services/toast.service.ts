import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 0;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, kind: ToastKind = 'info', durationMs = 3000) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(message: string, durationMs?: number) {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number) {
    this.show(message, 'error', durationMs);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
