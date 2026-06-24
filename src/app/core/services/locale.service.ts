import { Injectable, computed, effect, signal } from '@angular/core';

export type Lang = 'en' | 'pt';

const STORAGE_KEY = 'hr-lang';

type Params = Record<string, string | number>;

/** Flat translation dictionaries. Keys are shared; `{name}` placeholders are interpolated. */
const MESSAGES: Record<Lang, Record<string, string>> = {
  en: {
    // Common
    'common.switchToLight': 'Switch to light mode',
    'common.switchToDark': 'Switch to dark mode',
    'common.signOut': 'Sign out',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving…',
    'common.today': 'Today',
    'common.remove': 'Remove',

    // Home
    'home.title': 'Hour Registration',
    'home.exportDay': 'Export this day as CSV',
    'home.week': 'Week',
    'home.weekAria': 'View weekly summary',
    'home.settings': 'Open settings',
    'home.previousDay': 'Previous day',
    'home.nextDay': 'Next day',
    'home.openCalendar': 'Open calendar',
    'home.goToToday': 'Go to today',
    'home.goalReached': 'Daily goal reached 🎉',
    'home.totalToday': 'Total today',
    'home.totalTodayAria': 'Total hours today',
    'home.hoursDecimal': '{value} hours decimal',
    'home.progressAria': 'Progress toward {goal} hour daily goal',
    'home.goalPercent': '{percent}% of {goal}h goal',
    'home.workItems': 'Work items',
    'home.add': 'Add',
    'home.addAria': 'Add new work item',
    'home.loadingAria': 'Loading work items',
    'home.empty': 'No work items for this day.',
    'home.addFirst': 'Add your first item',
    'home.approved': 'Approved',
    'home.approvedAria': 'Hours approved',
    'home.copyAria': 'Copy hours for {title}',
    'home.hoursAria': '{value} hours',
    'home.approveAria': 'Approve {title}',
    'home.unapproveAria': 'Unapprove {title}',
    'home.editAria': 'Edit {title}',
    'home.deleteAria': 'Delete {title}',
    'home.unapproveBeforeEditing': 'Unapprove before editing',
    'home.unapproveBeforeDeleting': 'Unapprove before deleting',
    'home.timeEntriesAria': 'Time entries',
    'home.workItemsTodayAria': 'Work items for today',
    'home.deleteConfirm': 'Delete this work item?',
    'home.deleting': 'Deleting…',
    'home.delete': 'Delete',

    // Toasts & errors
    'toast.noItemsToExport': 'No work items to export for this day',
    'toast.dayExported': 'Day exported as CSV',
    'toast.copied': 'Copied {value}h to clipboard',
    'toast.copyFailed': 'Could not copy to clipboard',
    'toast.itemUpdated': 'Work item updated',
    'toast.itemAdded': 'Work item added',
    'toast.itemApproved': 'Item approved',
    'toast.approvalRemoved': 'Approval removed',
    'toast.itemDeleted': 'Work item deleted',
    'toast.noHoursToExport': 'No hours to export for this week',
    'toast.weekExported': 'Weekly CSV exported',
    'toast.colorsSaved': 'Colors saved',
    'toast.colorsError': 'Could not save colors',
    'error.loadItems': 'Failed to load work items.',
    'error.updateApproval': 'Failed to update approval.',
    'error.deleteItem': 'Failed to delete work item.',
    'error.loadSummary': 'Failed to load weekly summary.',
    'error.saveItem': 'Failed to save work item.',

    // Summary
    'summary.title': 'Weekly Summary',
    'summary.back': 'Back to day view',
    'summary.exportWeek': 'Export this week as CSV',
    'summary.previousWeek': 'Previous week',
    'summary.nextWeek': 'Next week',
    'summary.thisWeek': 'This week',
    'summary.weekOf': 'Week of',
    'summary.goToThisWeek': 'Go to this week',
    'summary.total': 'Total',
    'summary.avgPerDay': 'Avg / day',
    'summary.daysWorked': 'Days worked',
    'summary.hoursPerDayAria': 'Hours per day',
    'summary.dailyBreakdownAria': 'Daily breakdown',
    'summary.breakdown': 'Breakdown',
    'summary.todayTag': 'Today',
    'summary.item': 'item',
    'summary.items': 'items',
    'summary.dayHoursAria': '{day}: {hours}',

    // Login
    'login.signIn': 'Sign in',
    'login.subtitle': 'Enter your credentials to continue',
    'login.formAria': 'Sign in form',
    'login.email': 'Email address',
    'login.emailError': 'Please enter a valid email address.',
    'login.password': 'Password',
    'login.passwordError': 'Password must be at least 6 characters.',
    'login.signingIn': 'Signing in…',

    // Work item form
    'form.editTitle': 'Edit work item',
    'form.addTitle': 'Add work item',
    'form.close': 'Close dialog',
    'form.formAria': 'Work item form',
    'form.title': 'Title',
    'form.titlePlaceholder': 'What did you work on?',
    'form.titleRequired': 'Title is required.',
    'form.description': 'Description',
    'form.descriptionPlaceholder': 'Optional details…',
    'form.timeEntries': 'Time entries',
    'form.entryAria': 'Time entry {n}',
    'form.entry': 'Entry {n}',
    'form.removeEntryAria': 'Remove time entry {n}',
    'form.start': 'Start',
    'form.required': 'Required.',
    'form.end': 'End',
    'form.optional': '(optional)',
    'form.mustBeAfterStart': 'Must be after start.',
    'form.duration': 'Duration',
    'form.totalDurationAria': 'Total calculated duration',
    'form.addTimeEntry': 'Add time entry',
    'form.totalDuration': 'Total duration',
    'form.update': 'Update',

    // Calendar
    'calendar.aria': 'Calendar, {month}',
    'calendar.previousMonth': 'Previous month',
    'calendar.nextMonth': 'Next month',
    'calendar.dayAria': '{date}',

    // Toast
    'toast.dismiss': 'Dismiss notification',

    // Settings
    'settings.title': 'Settings',
    'settings.back': 'Back to home',
    'settings.accentColor': 'Accent color',
    'settings.accentDescription':
      'Choose your accent color for light and dark mode. Changes apply instantly; press Save to keep them across devices.',
    'settings.presets': 'Presets',
    'settings.applyPreset': 'Apply {name} preset',
    'settings.lightModeAccent': 'Light mode accent',
    'settings.darkModeAccent': 'Dark mode accent',
    'settings.preview': 'Preview',
    'settings.light': 'Light',
    'settings.dark': 'Dark',
    'settings.resetDefault': 'Reset to default',
    'settings.language': 'Language',
    'settings.languageDescription': 'Choose the app language.',
    'settings.languageEn': 'English',
    'settings.languagePt': 'Portuguese',
    'preset.Blue': 'Blue',
    'preset.Violet': 'Violet',
    'preset.Emerald': 'Emerald',
    'preset.Rose': 'Rose',
    'preset.Amber': 'Amber',
    'preset.Cyan': 'Cyan',
    'preset.Slate': 'Slate',
    'preset.Fuchsia': 'Fuchsia',
  },
  pt: {
    // Common
    'common.switchToLight': 'Mudar para o modo claro',
    'common.switchToDark': 'Mudar para o modo escuro',
    'common.signOut': 'Sair',
    'common.cancel': 'Cancelar',
    'common.save': 'Salvar',
    'common.saving': 'Salvando…',
    'common.today': 'Hoje',
    'common.remove': 'Remover',

    // Home
    'home.title': 'Registro de Horas',
    'home.exportDay': 'Exportar este dia como CSV',
    'home.week': 'Semana',
    'home.weekAria': 'Ver resumo semanal',
    'home.settings': 'Abrir configurações',
    'home.previousDay': 'Dia anterior',
    'home.nextDay': 'Próximo dia',
    'home.openCalendar': 'Abrir calendário',
    'home.goToToday': 'Ir para hoje',
    'home.goalReached': 'Meta diária alcançada 🎉',
    'home.totalToday': 'Total de hoje',
    'home.totalTodayAria': 'Total de horas hoje',
    'home.hoursDecimal': '{value} horas em decimal',
    'home.progressAria': 'Progresso da meta diária de {goal} horas',
    'home.goalPercent': '{percent}% da meta de {goal}h',
    'home.workItems': 'Itens de trabalho',
    'home.add': 'Adicionar',
    'home.addAria': 'Adicionar novo item de trabalho',
    'home.loadingAria': 'Carregando itens de trabalho',
    'home.empty': 'Nenhum item de trabalho para este dia.',
    'home.addFirst': 'Adicione seu primeiro item',
    'home.approved': 'Aprovado',
    'home.approvedAria': 'Horas aprovadas',
    'home.copyAria': 'Copiar horas de {title}',
    'home.hoursAria': '{value} horas',
    'home.approveAria': 'Aprovar {title}',
    'home.unapproveAria': 'Desaprovar {title}',
    'home.editAria': 'Editar {title}',
    'home.deleteAria': 'Excluir {title}',
    'home.unapproveBeforeEditing': 'Desaprove antes de editar',
    'home.unapproveBeforeDeleting': 'Desaprove antes de excluir',
    'home.timeEntriesAria': 'Entradas de horário',
    'home.workItemsTodayAria': 'Itens de trabalho de hoje',
    'home.deleteConfirm': 'Excluir este item de trabalho?',
    'home.deleting': 'Excluindo…',
    'home.delete': 'Excluir',

    // Toasts & errors
    'toast.noItemsToExport': 'Nenhum item de trabalho para exportar neste dia',
    'toast.dayExported': 'Dia exportado como CSV',
    'toast.copied': '{value}h copiado para a área de transferência',
    'toast.copyFailed': 'Não foi possível copiar',
    'toast.itemUpdated': 'Item de trabalho atualizado',
    'toast.itemAdded': 'Item de trabalho adicionado',
    'toast.itemApproved': 'Item aprovado',
    'toast.approvalRemoved': 'Aprovação removida',
    'toast.itemDeleted': 'Item de trabalho excluído',
    'toast.noHoursToExport': 'Nenhuma hora para exportar nesta semana',
    'toast.weekExported': 'CSV semanal exportado',
    'toast.colorsSaved': 'Cores salvas',
    'toast.colorsError': 'Não foi possível salvar as cores',
    'error.loadItems': 'Falha ao carregar os itens de trabalho.',
    'error.updateApproval': 'Falha ao atualizar a aprovação.',
    'error.deleteItem': 'Falha ao excluir o item de trabalho.',
    'error.loadSummary': 'Falha ao carregar o resumo semanal.',
    'error.saveItem': 'Falha ao salvar o item de trabalho.',

    // Summary
    'summary.title': 'Resumo Semanal',
    'summary.back': 'Voltar para a visão do dia',
    'summary.exportWeek': 'Exportar esta semana como CSV',
    'summary.previousWeek': 'Semana anterior',
    'summary.nextWeek': 'Próxima semana',
    'summary.thisWeek': 'Esta semana',
    'summary.weekOf': 'Semana de',
    'summary.goToThisWeek': 'Ir para esta semana',
    'summary.total': 'Total',
    'summary.avgPerDay': 'Média / dia',
    'summary.daysWorked': 'Dias trabalhados',
    'summary.hoursPerDayAria': 'Horas por dia',
    'summary.dailyBreakdownAria': 'Detalhamento diário',
    'summary.breakdown': 'Detalhamento',
    'summary.todayTag': 'Hoje',
    'summary.item': 'item',
    'summary.items': 'itens',
    'summary.dayHoursAria': '{day}: {hours}',

    // Login
    'login.signIn': 'Entrar',
    'login.subtitle': 'Insira suas credenciais para continuar',
    'login.formAria': 'Formulário de login',
    'login.email': 'Endereço de e-mail',
    'login.emailError': 'Por favor, insira um e-mail válido.',
    'login.password': 'Senha',
    'login.passwordError': 'A senha deve ter pelo menos 6 caracteres.',
    'login.signingIn': 'Entrando…',

    // Work item form
    'form.editTitle': 'Editar item de trabalho',
    'form.addTitle': 'Adicionar item de trabalho',
    'form.close': 'Fechar janela',
    'form.formAria': 'Formulário de item de trabalho',
    'form.title': 'Título',
    'form.titlePlaceholder': 'No que você trabalhou?',
    'form.titleRequired': 'O título é obrigatório.',
    'form.description': 'Descrição',
    'form.descriptionPlaceholder': 'Detalhes opcionais…',
    'form.timeEntries': 'Entradas de horário',
    'form.entryAria': 'Entrada de horário {n}',
    'form.entry': 'Entrada {n}',
    'form.removeEntryAria': 'Remover entrada de horário {n}',
    'form.start': 'Início',
    'form.required': 'Obrigatório.',
    'form.end': 'Fim',
    'form.optional': '(opcional)',
    'form.mustBeAfterStart': 'Deve ser após o início.',
    'form.duration': 'Duração',
    'form.totalDurationAria': 'Duração total calculada',
    'form.addTimeEntry': 'Adicionar entrada de horário',
    'form.totalDuration': 'Duração total',
    'form.update': 'Atualizar',

    // Calendar
    'calendar.aria': 'Calendário, {month}',
    'calendar.previousMonth': 'Mês anterior',
    'calendar.nextMonth': 'Próximo mês',
    'calendar.dayAria': '{date}',

    // Toast
    'toast.dismiss': 'Dispensar notificação',

    // Settings
    'settings.title': 'Configurações',
    'settings.back': 'Voltar para o início',
    'settings.accentColor': 'Cor de destaque',
    'settings.accentDescription':
      'Escolha a cor de destaque para os modos claro e escuro. As mudanças são aplicadas na hora; toque em Salvar para mantê-las em todos os dispositivos.',
    'settings.presets': 'Predefinições',
    'settings.applyPreset': 'Aplicar predefinição {name}',
    'settings.lightModeAccent': 'Destaque do modo claro',
    'settings.darkModeAccent': 'Destaque do modo escuro',
    'settings.preview': 'Pré-visualização',
    'settings.light': 'Claro',
    'settings.dark': 'Escuro',
    'settings.resetDefault': 'Restaurar padrão',
    'settings.language': 'Idioma',
    'settings.languageDescription': 'Escolha o idioma do aplicativo.',
    'settings.languageEn': 'Inglês',
    'settings.languagePt': 'Português',
    'preset.Blue': 'Azul',
    'preset.Violet': 'Violeta',
    'preset.Emerald': 'Esmeralda',
    'preset.Rose': 'Rosa',
    'preset.Amber': 'Âmbar',
    'preset.Cyan': 'Ciano',
    'preset.Slate': 'Ardósia',
    'preset.Fuchsia': 'Fúcsia',
  },
};

const WEEKDAY_SHORTS: Record<Lang, readonly string[]> = {
  en: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  pt: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
};

/**
 * Runtime i18n for Portuguese and English.
 *
 * The active language is a signal, so templates that read it through `t()` (or
 * `dateLocale()`) re-render automatically on change — even under OnPush. The choice
 * persists in localStorage and defaults to the browser language on first visit.
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly lang = signal<Lang>(this.readStored() ?? this.detectLang());

  /** Locale id for Angular's DatePipe/DecimalPipe (e.g. `{{ d | date:'EEEE':undefined:loc.dateLocale() }}`). */
  readonly dateLocale = computed(() => (this.lang() === 'pt' ? 'pt-BR' : 'en-US'));

  /** Short weekday labels for the calendar header, starting on Sunday. */
  readonly weekDayShorts = computed(() => WEEKDAY_SHORTS[this.lang()]);

  constructor() {
    effect(() => {
      const lang = this.lang();
      document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {
        // ignore storage errors (private mode, etc.)
      }
    });
  }

  /** Translate a key, interpolating `{name}` placeholders. Bound so templates can call it directly. */
  readonly t = (key: string, params?: Params): string => {
    const dict = MESSAGES[this.lang()];
    let value = dict[key] ?? MESSAGES.en[key] ?? key;
    if (params) {
      for (const [name, replacement] of Object.entries(params)) {
        value = value.replace(`{${name}}`, String(replacement));
      }
    }
    return value;
  };

  setLang(lang: Lang) {
    this.lang.set(lang);
  }

  toggle() {
    this.lang.update((l) => (l === 'pt' ? 'en' : 'pt'));
  }

  private readStored(): Lang | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'pt' || value === 'en' ? value : null;
    } catch {
      return null;
    }
  }

  private detectLang(): Lang {
    return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  }
}
