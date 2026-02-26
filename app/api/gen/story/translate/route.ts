import { NextRequest, NextResponse } from 'next/server';

interface TranslateRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

interface TranslateResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

// Simple translation using Google Translate (free tier via web scraping approach)
// For production, consider using Google Cloud Translation API with proper API key
async function translateWithGoogleTranslate(
  text: string,
  targetLang: string,
  sourceLang: string = 'auto',
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  try {
    // Using Google Translate's public endpoint (no API key required but rate limited)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Translation-Bot/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse Google Translate response format
    if (data && data[0] && data[0][0]) {
      const translatedText = data[0].map((item: { [x: string]: string }) => item[0]).join('');
      const detectedSourceLanguage = data[2] || sourceLang;

      return {
        translatedText,
        detectedSourceLanguage:
          detectedSourceLanguage !== 'auto' ? detectedSourceLanguage : undefined,
      };
    }

    throw new Error('Invalid response format from translation service');
  } catch (error) {
    console.error('Translation error:', error);
    // Fallback: return original text if translation fails
    return { translatedText: text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage }: TranslateRequest = await request.json();

    // Validate input
    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters: text and targetLanguage' },
        { status: 400 },
      );
    }

    // Return early for empty or whitespace-only text
    if (!text.trim()) {
      return NextResponse.json({ translatedText: text });
    }

    // Skip translation if target language is 'original' or same as source language
    if (targetLanguage === 'original' || targetLanguage === sourceLanguage) {
      return NextResponse.json({ translatedText: text });
    }

    const result = await translateWithGoogleTranslate(
      text,
      targetLanguage,
      sourceLanguage || 'auto',
    );

    const response: TranslateResponse = {
      translatedText: result.translatedText,
      detectedSourceLanguage: result.detectedSourceLanguage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
