import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';
import { PreferencesService } from './core/services/preferences.service';
import { LocaleService } from './core/services/locale.service';
import { ToastComponent } from './shared/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // Instantiate eagerly so the theme and accent colors are applied on every route.
  private readonly theme = inject(ThemeService);
  private readonly preferences = inject(PreferencesService);
  private readonly locale = inject(LocaleService);
}
