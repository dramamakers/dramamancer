import { forwardRef, useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';

const Textarea = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (value: string) => void;
    onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    style?: React.CSSProperties;
    rows?: number;
    maxLength?: number;
  }
>(
  (
    {
      value,
      onChange,
      onClick,
      onKeyDown,
      className = '',
      placeholder = '',
      style,
      rows,
      maxLength,
      disabled,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const combinedRef = (node: HTMLTextAreaElement) => {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
      textareaRef.current = node;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    // Adjust height when value changes
    useEffect(() => {
      adjustHeight();
    }, [value]);

    return (
      <div className="relative w-full">
        <textarea
          ref={combinedRef}
          className={twMerge(
            'w-full resize-none overflow-y-auto focus:outline-none',
            className,
            maxLength && 'pb-10!',
          )}
          value={value}
          onChange={handleChange}
          onClick={onClick}
          placeholder={placeholder}
          onKeyDown={onKeyDown}
          style={{ ...style }}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
        />
        {maxLength && (
          <div
            className={`absolute bottom-0 right-0 p-2 pb-3 text-sm ${value.length > maxLength ? 'text-red-500' : 'text-slate-500'}`}
          >
            {value.length}/{maxLength}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;
