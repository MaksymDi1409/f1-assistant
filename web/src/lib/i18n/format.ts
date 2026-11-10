import type { Locale } from "./config";

// Підставити значення в шаблон: fmt("Етап {round}", { round: 5 }) → "Етап 5"
export function fmt(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

type PluralForms = { one: string; few: string; many: string; other: string };

// Правильна форма слова для числа за правилами мови:
// українською 1 рік, 2 роки, 5 років; англійською 1 year, 5 years
export function plural(forms: PluralForms, n: number, locale: Locale): string {
  const category = new Intl.PluralRules(locale).select(n) as keyof PluralForms;
  return fmt(forms[category] ?? forms.other, { n });
}
