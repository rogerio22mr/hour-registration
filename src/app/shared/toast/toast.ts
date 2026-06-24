import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { LocaleService } from '../../core/services/locale.service';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.html',
  styleUrl: './toast.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly toastService = inject(ToastService);
  protected readonly t = inject(LocaleService).t;
  readonly toasts = this.toastService.toasts;

  dismiss(id: number) {
    this.toastService.dismiss(id);
  }
}
