import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-sm text-gray-400 mb-1">{label}</label>}
      <input
        {...props}
        className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
      />
    </div>
  );
};

export default Input;
