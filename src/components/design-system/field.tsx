import type { InputHTMLAttributes } from "react";
export function Field({
  label,
  hint,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
      />
      {(hint || error) && (
        <small id={`${id}-note`} role={error ? "alert" : undefined}>
          {error ?? hint}
        </small>
      )}
    </div>
  );
}
