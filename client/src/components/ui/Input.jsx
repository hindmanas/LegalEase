import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';

export default function Input({ label, error, className, type, ...props }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-semibold text-slateink">{label}</span>}
      <div className="relative">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={clsx(
            'h-12 w-full rounded-lg border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-fern focus:ring-4 focus:ring-fern/10',
            isPassword && 'pr-10',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="mt-2 block text-xs font-semibold text-clay">{error}</span>}
    </label>
  );
}
