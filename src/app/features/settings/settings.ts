import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import {
  DEFAULT_ACCENT_DARK,
  DEFAULT_ACCENT_LIGHT,
  PreferencesService,
} from '../../core/services/preferences.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { Lang, LocaleService } from '../../core/services/locale.service';

interface PresetSwatch {
  name: string;
  light: string;
  dark: string;
}

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly preferences = inject(PreferencesService);
  private readonly theme = inject(ThemeService);
  private readonly toast = inject(ToastService);
  protected readonly loc = inject(LocaleService);
  protected readonly t = this.loc.t;

  readonly isDark = this.theme.isDark;
  readonly lang = this.loc.lang;
  readonly saving = signal(false);

  readonly form = new FormGroup({
    light: new FormControl(this.preferences.accentLight(), { nonNullable: true }),
    dark: new FormControl(this.preferences.accentDark(), { nonNullable: true }),
  });

  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly lightAccent = computed(() => this.value().light ?? DEFAULT_ACCENT_LIGHT);
  readonly darkAccent = computed(() => this.value().dark ?? DEFAULT_ACCENT_DARK);

  readonly isDefault = computed(
    () => this.lightAccent() === DEFAULT_ACCENT_LIGHT && this.darkAccent() === DEFAULT_ACCENT_DARK,
  );

  readonly presets: readonly PresetSwatch[] = [
    { name: 'Blue', light: '#2563eb', dark: '#60a5fa' },
    { name: 'Violet', light: '#7c3aed', dark: '#a78bfa' },
    { name: 'Emerald', light: '#059669', dark: '#34d399' },
    { name: 'Rose', light: '#e11d48', dark: '#fb7185' },
    { name: 'Amber', light: '#d97706', dark: '#fbbf24' },
    { name: 'Cyan', light: '#0891b2', dark: '#22d3ee' },
    { name: 'Slate', light: '#475569', dark: '#94a3b8' },
    { name: 'Fuchsia', light: '#c026d3', dark: '#e879f9' },
  ];

  constructor() {
    // Live-apply to the whole app as the user tweaks (Save persists to Supabase).
    effect(() => {
      this.preferences.setAccents(this.lightAccent(), this.darkAccent());
    });
  }

  applyPreset(preset: PresetSwatch) {
    this.form.setValue({ light: preset.light, dark: preset.dark });
  }

  setLang(lang: Lang) {
    this.loc.setLang(lang);
  }

  resetDefaults() {
    this.form.setValue({ light: DEFAULT_ACCENT_LIGHT, dark: DEFAULT_ACCENT_DARK });
  }

  async save() {
    this.saving.set(true);
    try {
      await this.preferences.save(this.lightAccent(), this.darkAccent());
      this.toast.success(this.t('toast.colorsSaved'));
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : this.t('toast.colorsError'));
    } finally {
      this.saving.set(false);
    }
  }

  /** Mix a color toward white/black — used to build the live preview swatches. */
  private mix(color: string, mixWith: 'white' | 'black', pct: number): string {
    return `color-mix(in oklab, ${color}, ${mixWith} ${pct}%)`;
  }

  gradient(color: string): string {
    return `linear-gradient(135deg, ${color}, ${this.mix(color, 'black', 18)})`;
  }

  softBg(color: string, dark: boolean): string {
    return dark ? this.mix(color, 'black', 70) : this.mix(color, 'white', 86);
  }

  softText(color: string, dark: boolean): string {
    return dark ? this.mix(color, 'white', 28) : this.mix(color, 'black', 8);
  }
}
