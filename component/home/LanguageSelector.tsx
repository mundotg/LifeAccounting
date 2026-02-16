import { Locale, localeLabels } from "@/lib/i18n";

interface LanguageSelectorProps {
  locale: Locale;
  onChange: (locale: Locale) => void;
}

export function LanguageSelector({ locale, onChange }: LanguageSelectorProps) {
  return (
    <select
      value={locale}
      onChange={(e) => onChange(e.target.value as Locale)}
      className="border rounded p-1 text-sm"
      aria-label="language-selector"
    >
      {Object.entries(localeLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
