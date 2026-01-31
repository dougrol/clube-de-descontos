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
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full bg-white/5 border border-white/10 rounded-lg py-3 text-sm text-white placeholder:text-gray-600 focus:border-gold-500 focus:bg-obsidian-900 outline-none transition-all ${icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
};

export default Input;
