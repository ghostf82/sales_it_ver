import { useState, useEffect } from 'react';
import { toEnglishDigits, containsOnlyEnglishDigits } from '../utils/numberUtils';
import clsx from 'clsx';

interface NumberInputProps {
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  allowDecimals?: boolean;
  name?: string;
  id?: string;
  error?: string;
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
  disabled = false,
  required = false,
  min,
  max,
  allowDecimals = true,
  name,
  id,
  error
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize internal value from props
  useEffect(() => {
    setInternalValue(value?.toString() || '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Convert any non-English digits to English
    const englishDigits = toEnglishDigits(inputValue);
    
    // For empty input, just update the state
    if (englishDigits === '') {
      setInternalValue('');
      onChange('');
      setHasError(false);
      setErrorMessage('');
      return;
    }
    
    // Validate the input
    const regex = allowDecimals ? /^-?[0-9]*\.?[0-9]*$/ : /^-?[0-9]*$/;
    
    if (regex.test(englishDigits)) {
      setInternalValue(englishDigits);
      onChange(englishDigits);
      setHasError(false);
      setErrorMessage('');
    } else {
      // Keep the previous valid value but show error
      setHasError(true);
      setErrorMessage('يرجى إدخال أرقام إنجليزية فقط');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Validate min/max on blur
    const numValue = parseFloat(internalValue);
    
    if (internalValue && !isNaN(numValue)) {
      let hasValidationError = false;
      
      if (min !== undefined && numValue < min) {
        setHasError(true);
        setErrorMessage(`القيمة يجب أن تكون ${min} أو أكثر`);
        hasValidationError = true;
      } else if (max !== undefined && numValue > max) {
        setHasError(true);
        setErrorMessage(`القيمة يجب أن تكون ${max} أو أقل`);
        hasValidationError = true;
      }
      
      if (!hasValidationError) {
        setHasError(false);
        setErrorMessage('');
      }
    }
    
    // Call the provided onBlur handler
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        id={id}
        className={clsx(
          "w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          hasError || error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "",
          disabled ? "bg-gray-100 cursor-not-allowed" : "",
          className
        )}
        dir="ltr" // Force left-to-right for numbers
      />
      {(hasError || error) && (
        <p className="mt-1 text-sm text-red-600">
          {error || errorMessage}
        </p>
      )}
    </div>
  );
}