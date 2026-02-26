import { ButtonHTMLAttributes, Ref, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'icon' | 'link' | 'icon-filled' | 'link-filled' | 'dotted';
};

const Button = (
  { className, children, disabled = false, style = {}, variant = 'primary', ...props }: ButtonProps,
  ref: Ref<HTMLButtonElement>,
) => {
  return (
    <button
      ref={ref}
      {...props}
      style={style}
      disabled={disabled}
      onClick={disabled ? undefined : props.onClick}
      className={twMerge(
        'flex-center relative select-none py-2 px-4 text-md font-medium group-button group/button bg-white dark:bg-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:border-slate-900 active:bg-slate-200 dark:active:bg-slate-950 rounded-md border border-slate-300 dark:border-slate-800 disabled:opacity-50 outline-none',
        variant === 'icon' &&
          'rounded-full border-none p-1.5 bg-transparent! text-black dark:text-white hover:bg-black/10! active:bg-black/20! hover:dark:bg-white/10! active:dark:bg-white/20! transition-none!',
        !disabled && 'cursor-pointer',
        disabled && 'cursor-not-allowed',
        variant === 'link' &&
          'bg-transparent! border-none! underline! hover:opacity-60 active:opacity-40 text-slate-600 dark:text-slate-400 p-0',
        variant === 'icon-filled' &&
          'border-none rounded-full p-1.5 transition-none! bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 active:bg-slate-400 dark:active:bg-slate-900',
        variant === 'link-filled' &&
          'border-none px-1 py-0 bg-transparent! text-black dark:text-white hover:bg-black/10! active:bg-black/20! hover:dark:bg-white/10! active:dark:bg-white/20! transition-none! rounded-sm',
        variant === 'dotted' &&
          'w-full p-3 border-2 border-dashed border-slate-300 dark:border-slate-600 bg-transparent! hover:border-slate-400 dark:hover:border-slate-500 text-slate-600 dark:text-slate-400 justify-center gap-2 flex items-center',
        className,
      )}
    >
      {children}
    </button>
  );
};

export default forwardRef(Button);
