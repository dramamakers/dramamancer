import { HELP_LINK, supportedLanguages } from '@/app/constants';
import {
  getSelectedLanguage,
  Language,
  setSelectedLanguage,
} from '@/utils/hooks/useLocalTranslator';
import { useEffect, useRef, useState } from 'react';
import { twMerge } from 'tailwind-merge';

export default function DiscoverFooter() {
  const [selectedLanguage, setSelectedLanguageState] = useState<Language | undefined>(undefined);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedLanguageState(getSelectedLanguage());
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  const handleLanguageChange = (language: Language) => {
    setSelectedLanguage(language);
    setSelectedLanguageState(language);
    setIsDropdownOpen(false);
  };

  return (
    <footer className="my-8">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Research demo made with ♡ .𖥔 ݁ ˖ by the{' '}
            <span className="text-slate-600 dark:text-slate-400">Dramamancer team</span>
          </p>
          <div className="flex flex-col items-start md:items-center md:flex-row gap-4 md:gap-8 text-sm">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 transition-colors cursor-pointer"
              >
                <span>🌐</span>
                <span>{selectedLanguage}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-10 min-w-[140px]">
                  <div className="py-1">
                    {supportedLanguages.map((language) => (
                      <button
                        key={language}
                        onClick={() => handleLanguageChange(language)}
                        className={twMerge(
                          `w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer`,
                          selectedLanguage === language
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100'
                            : 'text-slate-600 dark:text-slate-400',
                        )}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <a
              href={HELP_LINK}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            >
              Learn more
            </a>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
            © 2025 Dramamancer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
