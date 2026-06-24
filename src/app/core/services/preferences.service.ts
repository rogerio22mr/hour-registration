import { Injectable, effect, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

const STORAGE_KEY = 'hr-accent';

/** Default accent colors — match Tailwind's blue-600 (light) and blue-400 (dark). */
export const DEFAULT_ACCENT_LIGHT = '#2563eb';
export const DEFAULT_ACCENT_DARK = '#60a5fa';

export interface AccentColors {
  light: string;
  dark: string;
}

/**
 * Holds the user's customizable accent colors for light and dark mode.
 *
 * The values are exposed to CSS as `--hr-accent-light` / `--hr-accent-dark` on the
 * document root; `styles.css` derives the whole blue/indigo palette from them, so the
 * entire app recolors instantly. Preferences load from localStorage first (no flash of
 * the default color) and are then synced from Supabase for cross-device persistence.
 */
@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly supabase = inject(SupabaseService);

  readonly accentLight = signal<string>(DEFAULT_ACCENT_LIGHT);
  readonly accentDark = signal<string>(DEFAULT_ACCENT_DARK);
  readonly loaded = signal(false);

  constructor() {
    this.readLocal();

    effect(() => {
      const root = document.documentElement;
      root.style.setProperty('--hr-accent-light', this.accentLight());
      root.style.setProperty('--hr-accent-dark', this.accentDark());
    });

    void this.loadFromServer();
  }

  /** Apply colors locally (CSS + localStorage) without persisting to the server. */
  setAccents(light: string, dark: string) {
    this.accentLight.set(light);
    this.accentDark.set(dark);
    this.writeLocal();
  }

  /** Persist the given colors to Supabase (and locally) for the signed-in user. */
  async save(light: string, dark: string): Promise<void> {
    this.setAccents(light, dark);

    const {
      data: { user },
    } = await this.supabase.auth.getUser();
    if (!user) {
      throw new Error('You must be signed in to save your colors.');
    }

    const { error } = await this.supabase.from('user_preferences').upsert(
      {
        user_id: user.id,
        accent_light: light,
        accent_dark: dark,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  private async loadFromServer(): Promise<void> {
    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('accent_light, accent_dark')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        if (typeof data.accent_light === 'string') this.accentLight.set(data.accent_light);
        if (typeof data.accent_dark === 'string') this.accentDark.set(data.accent_dark);
        this.writeLocal();
      }
    } catch {
      // ignore — fall back to local/default colors
    } finally {
      this.loaded.set(true);
    }
  }

  private readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<AccentColors>;
      if (typeof parsed.light === 'string') this.accentLight.set(parsed.light);
      if (typeof parsed.dark === 'string') this.accentDark.set(parsed.dark);
    } catch {
      // ignore malformed/unavailable storage
    }
  }

  private writeLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ light: this.accentLight(), dark: this.accentDark() } satisfies AccentColors),
      );
    } catch {
      // ignore storage errors (private mode, etc.)
    }
  }
}
