'use client';
import Button from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ArrowPathIcon, LightBulbIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useState } from 'react';
import { useChatContext } from '../ChatContext';
import { INITIAL_SUGGESTIONS, InitialSuggestion, SUGGESTIONS_PER_BATCH } from '../suggestions';

interface InitialSuggestionsProps {
  onSuggestionClick: (suggestion: InitialSuggestion) => void;
}

export default function InitialSuggestions({ onSuggestionClick }: InitialSuggestionsProps) {
  const { isLoading } = useChatContext();
  const [batchIndex, setBatchIndex] = useState(0);

  const totalBatches = Math.ceil(INITIAL_SUGGESTIONS.length / SUGGESTIONS_PER_BATCH);
  const currentSuggestions = INITIAL_SUGGESTIONS.slice(
    batchIndex * SUGGESTIONS_PER_BATCH,
    (batchIndex + 1) * SUGGESTIONS_PER_BATCH,
  );

  const handleNextBatch = () => {
    setBatchIndex((prev) => (prev + 1) % totalBatches);
  };

  return (
    <div className="flex gap-1.5 items-center">
      {/* Fixed lightbulb button */}
      <Button onClick={handleNextBatch} variant="icon-filled" title="Show more ideas">
        <LightBulbIcon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      </Button>

      {/* Scrollable suggestions */}
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {currentSuggestions.map((suggestion) => (
          <Chip
            key={suggestion.id}
            onClick={() => !isLoading && onSuggestionClick(suggestion)}
            className={`shrink-0 text-xs ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {suggestion.imageUrl && (
              <div className="w-5 h-5 rounded overflow-hidden shrink-0 -ml-1">
                <Image
                  src={suggestion.imageUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            )}
            <span>{suggestion.title}</span>
          </Chip>
        ))}
      </div>

      {/* Refresh button at the end */}
      <Button onClick={handleNextBatch} variant="icon" title="Show more ideas">
        <ArrowPathIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
