import clsx from 'clsx';

const variants = {
  primary: 'bg-ink text-white hover:bg-slateink shadow-ring',
  secondary: 'bg-white text-ink border border-line hover:border-sage/60 hover:bg-mist',
  ghost: 'text-slateink hover:bg-mist',
  danger: 'bg-clay text-white hover:bg-[#a74f37]'
};

export default function Button({ className, variant = 'primary', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={clsx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
