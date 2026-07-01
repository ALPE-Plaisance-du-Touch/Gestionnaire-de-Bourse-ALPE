interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Accessible on/off switch built on a native checkbox.
 */
export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps) {
  const inputId = id ?? `toggle-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label
      htmlFor={inputId}
      className={`flex items-start gap-3 py-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span className="relative inline-flex mt-0.5 shrink-0">
        <input
          id={inputId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className="w-10 h-6 rounded-full bg-sand transition-colors duration-200 peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-1"
          aria-hidden="true"
        />
        <span
          className="absolute left-0.5 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-4"
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-bark">{label}</span>
        {description && (
          <span className="text-xs text-bark-muted">{description}</span>
        )}
      </span>
    </label>
  );
}
