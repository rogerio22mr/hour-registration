import { brazilianHolidays, isBrazilianHoliday } from './holidays.util';

describe('brazilianHolidays', () => {
  it('includes the fixed national holidays', () => {
    const h = brazilianHolidays(2025);
    expect(h.has('2025-01-01')).toBe(true); // Confraternização
    expect(h.has('2025-04-21')).toBe(true); // Tiradentes
    expect(h.has('2025-05-01')).toBe(true); // Trabalho
    expect(h.has('2025-09-07')).toBe(true); // Independência
    expect(h.has('2025-10-12')).toBe(true); // Aparecida
    expect(h.has('2025-11-02')).toBe(true); // Finados
    expect(h.has('2025-11-15')).toBe(true); // República
    expect(h.has('2025-12-25')).toBe(true); // Natal
  });

  it('computes the movable holidays from Easter (2025: Easter = Apr 20)', () => {
    const h = brazilianHolidays(2025);
    expect(h.has('2025-03-03')).toBe(true); // Carnaval segunda
    expect(h.has('2025-03-04')).toBe(true); // Carnaval terça
    expect(h.has('2025-04-18')).toBe(true); // Sexta-feira Santa
    expect(h.has('2025-06-19')).toBe(true); // Corpus Christi
  });

  it('includes Consciência Negra from 2024 onward only', () => {
    expect(brazilianHolidays(2024).has('2024-11-20')).toBe(true);
    expect(brazilianHolidays(2025).has('2025-11-20')).toBe(true);
    expect(brazilianHolidays(2023).has('2023-11-20')).toBe(false);
  });

  it('does not flag ordinary days as holidays', () => {
    expect(isBrazilianHoliday('2025-06-30')).toBe(false);
    expect(isBrazilianHoliday('2025-12-25')).toBe(true);
  });
});
