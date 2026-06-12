import clsx from 'clsx';

export default function Textarea({ label, className, ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-semibold text-slateink">{label}</span>}
      <textarea
        className={clsx(
          'min-h-32 w-full resize-none rounded-lg border border-line bg-white px-3.5 py-3 text-sm leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-fern focus:ring-4 focus:ring-fern/10',
          className
        )}
        {...props}
      />
    </label>
  );
}
