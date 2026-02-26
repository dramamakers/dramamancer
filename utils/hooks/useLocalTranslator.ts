'use client';
import { useEffect, useState } from 'react';

const languagePairs = {
  Original: 'original',
  English: 'en',
  Spanish: 'es',
  Portuguese: 'pt',
  Italian: 'it',
  French: 'fr',
  Indonesian: 'id',
  German: 'de',
  Chinese: 'zh',
  Korean: 'ko',
  Japanese: 'ja',
  Hindi: 'hi',
  Bengali: 'bn',
} as const;

export type Language = keyof typeof languagePairs;

const languageShorthands: Record<string, string> = languagePairs;
const languageLonghands: Record<string, string> = Object.fromEntries(
  Object.entries(languagePairs).map(([long, short]) => [short, long]),
);

export const setSelectedLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('selectedLanguage', language);
    // Trigger a custom event to notify other components of the language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
  }
};

export const getSelectedLanguage = (): Language => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedLanguage');
      if (stored) return stored as Language;
    }
    return getLanguage(); // Fallback to browser detection
  } catch {
    return 'Original';
  }
};

export const isTranslationSupported = (): boolean => {
  // Translation is server-side, so it's always supported when we have network access
  if (typeof window === 'undefined') return false;
  return navigator.onLine !== false;
};

// Get language from localStorage with fallback
export const getLanguage = (): Language => {
  try {
    // First check if user has manually selected a language
    if (typeof window !== 'undefined') {
      const userSelected = localStorage.getItem('selectedLanguage');
      if (userSelected) {
        console.log(`Using user-selected language: ${userSelected}`);
        return userSelected as Language;
      }
    }

    const browserLang = navigator.language.split('-')[0];
    const detectedLanguage = languageLonghands[browserLang] || 'Original';
    return detectedLanguage as Language;
  } catch {
    return 'Original';
  }
};

export const getLanguageShort = (): string => {
  return languageShorthands[getLanguage()] || 'en';
}

export const translateText = async (text: string, targetLanguage: string): Promise<string> => {
  // Return early for empty or whitespace-only text
  if (!text || text.trim() === '') {
    return text;
  }

  try {
    const response = await fetch('/api/gen/story/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      console.error('Translation API request failed:', response.status);
      return text; // Return original text on API failure
    }

    const data = await response.json();
    if (data.error) {
      console.error('Translation error:', data.error);
      return text; // Return original text on translation error
    }

    return data.translatedText || text;
  } catch (error) {
    console.error('Translation request failed:', error);
    return text; // Return original text on network error
  }
};

export const translateTexts = async (
  texts: string[],
  targetLanguage: string,
): Promise<string[]> => {
  // Return early if no texts or target is English
  if (!texts || texts.length === 0) {
    return texts;
  }

  try {
    const response = await fetch('/api/gen/story/translate/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts,
        targetLanguage,
      }),
    });

    if (!response.ok) {
      console.error('Bulk translation API request failed:', response.status);
      return texts; // Return original texts on API failure
    }

    const data = await response.json();
    if (data.error) {
      console.error('Bulk translation error:', data.error);
      return texts; // Return original texts on translation error
    }

    return data.translatedTexts || texts;
  } catch (error) {
    console.error('Bulk translation request failed:', error);
    return texts; // Return original texts on network error
  }
};

export function useLocalTranslator({
  texts,
  skipTranslation,
}: {
  texts: string[];
  skipTranslation?: boolean;
}) {
  const [language, setLanguage] = useState(() => languageShorthands[getLanguage()]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedTexts, setTranslatedTexts] = useState<string[]>(texts);
  const shouldTranslate = !skipTranslation && isTranslationSupported();

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = () => {
      const newLanguage = languageShorthands[getLanguage()];
      setLanguage(newLanguage);
    };

    // Listen for custom language change events
    if (typeof window !== 'undefined') {
      window.addEventListener('languageChanged', handleLanguageChange);
      return () => window.removeEventListener('languageChanged', handleLanguageChange);
    }
  }, []);

  useEffect(() => {
    // Early return if no translation needed or Original language selected
    if (!shouldTranslate || language === 'original') {
      setTranslatedTexts(texts);
      return;
    }

    const translate = async () => {
      setIsTranslating(true);
      // Only translate non-empty texts
      const translations = Promise.all(
        texts.map((text) => {
          if (!text || text.trim() === '') {
            return Promise.resolve(text);
          }
          return translateText(text, language);
        }),
      );
      setTranslatedTexts(await translations);
      setIsTranslating(false);
    };

    translate();
  }, [texts.join('|'), language, shouldTranslate]);

  return { translatedTexts, isTranslating };
}
