import { useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import type { ReactNode } from 'react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import './Input.css';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

export default function Input({ label, error, icon, type = 'text', inputSize = 'md', className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`input-group input-${inputSize} ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {icon && <span className="input-icon">{icon}</span>}
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={`input-field ${icon ? 'has-icon' : ''}`}
          {...props}
        />
        {isPassword && (
          <button type="button" className="input-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
          </button>
        )}
      </div>
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
  return (
    <div className={`input-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea className="input-field textarea-field" {...props} />
      {error && <span className="input-error-msg">{error}</span>}
    </div>
  );
}
