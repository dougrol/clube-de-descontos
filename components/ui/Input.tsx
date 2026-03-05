import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, className = '', icon, ...props }) => {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-theme-muted uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
            {icon}
          </div>
        )}
        <input
          autoComplete="off"
          spellCheck={false}
          {...props}
          className={`w-full bg-white/5 border border-white/10 rounded-xl text-base text-theme-text placeholder:text-gray-600 outline-none focus:border-gold-500 focus:bg-obsidian-900 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:border-transparent transition-all ${icon ? 'pl-10 pr-3 p-3' : 'p-3'}`}
        />
      </div>
    </div>
  );
};

export default Input;
