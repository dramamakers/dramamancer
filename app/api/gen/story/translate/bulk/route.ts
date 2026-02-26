import { NextRequest, NextResponse } from 'next/server';

interface BulkTranslateRequest {
  texts: string[];
  targetLanguage: string;
  sourceLanguage?: string;
}

interface BulkTranslateResponse {
  translatedTexts: string[];
  detectedSourceLanguage?: string;
}

// Simple translation using Google Translate (free tier via web scraping approach)
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
    return { translatedText: text };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { texts, targetLanguage, sourceLanguage }: BulkTranslateRequest = await request.json();

    // Validate input
    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return NextResponse.json(
        { error: 'Missing required parameters: texts (array) and targetLanguage' },
        { status: 400 },
      );
    }

    // Skip translation if target language is 'original' or same as source language
    if (targetLanguage === 'original' || targetLanguage === sourceLanguage) {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Filter out empty texts and track their indices
    const nonEmptyTexts: { text: string; originalIndex: number }[] = [];
    texts.forEach((text, index) => {
      if (text && text.trim()) {
        nonEmptyTexts.push({ text, originalIndex: index });
      }
    });

    // If no texts to translate, return originals
    if (nonEmptyTexts.length === 0) {
      return NextResponse.json({ translatedTexts: texts });
    }

    // Translate non-empty texts with rate limiting (100ms between requests)
    const translatedResults: string[] = new Array(texts.length);
    let detectedSourceLanguage: string | undefined;

    for (let i = 0; i < nonEmptyTexts.length; i++) {
      const { text, originalIndex } = nonEmptyTexts[i];

      // Add delay between requests to avoid rate limiting
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const result = await translateWithGoogleTranslate(
        text,
        targetLanguage,
        sourceLanguage || 'auto',
      );

      translatedResults[originalIndex] = result.translatedText;

      // Use detected language from first translation
      if (!detectedSourceLanguage) {
        detectedSourceLanguage = result.detectedSourceLanguage;
      }
    }

    // Fill in empty texts with originals
    texts.forEach((text, index) => {
      if (!text || !text.trim()) {
        translatedResults[index] = text;
      }
    });

    const response: BulkTranslateResponse = {
      translatedTexts: translatedResults,
      detectedSourceLanguage,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Bulk translation API error:', error);
    return NextResponse.json({ error: 'Bulk translation failed' }, { status: 500 });
  }
}
