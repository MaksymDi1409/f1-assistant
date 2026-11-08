type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
};

export default function FormField({ label, name, type = "text", autoComplete }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-accent/50"
      />
    </label>
  );
}