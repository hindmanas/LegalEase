import clsx from 'clsx';

export default function Input({ label, error, className, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-semibold text-slateink">{label}</span>}
      <input
        className={clsx(
          'h-12 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-fern focus:ring-4 focus:ring-fern/10',
          className
        )}
        {...props}
      />
      {error && <span className="mt-2 block text-xs font-semibold text-clay">{error}</span>}
    </label>
  );
}
