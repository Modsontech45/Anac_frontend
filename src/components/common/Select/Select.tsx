import { type SelectHTMLAttributes, forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-windows-text mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={`
              w-full px-3 py-2 pr-10 rounded-windows border bg-windows-surface
              text-windows-text appearance-none
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-windows-accent focus:border-windows-accent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-windows-error focus:ring-windows-error' : 'border-windows-border'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {error ? (
              <AlertCircle className="w-5 h-5 text-windows-error" />
            ) : (
              <ChevronDown className="w-5 h-5 text-windows-textSecondary" />
            )}
          </div>
        </div>
        {error && <p className="mt-1 text-sm text-windows-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-windows-textSecondary">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
