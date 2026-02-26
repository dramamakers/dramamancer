import { suggestedGenres } from '@/app/constants';
import SpriteCard from '@/app/editor/components/SpriteCard';
import { EntityType } from '@/app/editor/utils/entity';
import Asset from '@/components/Asset';
import Button from '@/components/Button';
import Textarea from '@/components/Textarea';
import { LinkIcon } from '@heroicons/react/24/outline';
import { useRef, useState } from 'react';
import { useEditorProject } from '../../EditorContext';

export function SettingsList() {
  const { project, updateProject, openModal, closeModal } = useEditorProject();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredGenres = suggestedGenres.filter((genre) =>
    genre.toLowerCase().includes((project.settings.genre || '').toLowerCase()),
  );

  const handleSettingChange = (key: string, value: string) => {
    updateProject(
      {
        settings: {
          ...project.settings,
          [key]: value,
        },
      },
      {
        message: 'updated setting',
        context: JSON.stringify({ [key]: value }),
      },
    );
  };

  const handleGenreInputChange = (value: string) => {
    handleSettingChange('genre', value);
    setShowSuggestions(true);
  };

  const handleGenreSelect = (genre: string) => {
    handleSettingChange('genre', genre);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleGenreInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleGenreInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 150);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 id="publishing">Publishing</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Manage how your game will appear to others.
        </p>
      </div>
      <div className="flex flex-col gap-4 rounded-lg p-4 bg-white dark:bg-slate-900">
        <div className="flex flex-col">
          <h2>Thumbnail image</h2>
          <SpriteCard
            imageSelectModalProps={{
              type: EntityType.PROJECT,
              entity: project,
              updateEntity: (updates) => {
                handleSettingChange('thumbnailImageUrl', updates.imageUrl || '');
                closeModal();
              },
            }}
            hasImage={
              !!project.settings.thumbnailImageUrl && project.settings.thumbnailImageUrl !== ''
            }
          >
            <Asset
              imageUrl={project.settings.thumbnailImageUrl}
              className="h-50"
              alt="Project thumbnail"
            />
          </SpriteCard>
        </div>
        <div className="flex flex-col">
          <h2>Short description</h2>
          <Textarea
            value={project.settings.shortDescription}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none resize-none"
            onChange={(value) => handleSettingChange('shortDescription', value)}
            placeholder="What is a short pitch for this game? (e.g. 'A detective mystery game.')"
            maxLength={100}
          />
        </div>
        <div className="flex flex-col">
          <h2>Long description</h2>
          <Textarea
            value={project.settings.longDescription}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none resize-none"
            onChange={(value) => handleSettingChange('longDescription', value)}
            placeholder="What is this game about? Describe the setting and goals. (e.g. 'You are a detective investigating a murder in a small town.')"
            rows={5}
          />
        </div>
        <div className="flex flex-col">
          <h2>Genre</h2>
          <div className="relative">
            <input
              ref={inputRef}
              value={project.settings.genre || ''}
              onChange={(e) => handleGenreInputChange(e.target.value)}
              onFocus={handleGenreInputFocus}
              onBlur={handleGenreInputBlur}
              className="w-full"
              placeholder="Type to search genres or enter custom"
            />
            {showSuggestions && filteredGenres.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border border-slate-300 rounded-lg mt-1 max-h-40 overflow-y-auto dark:bg-slate-800 dark:border-slate-700"
              >
                {filteredGenres.map((genre) => (
                  <div
                    key={genre}
                    className="px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    {genre}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col">
          <h2>Allow others to remix your game</h2>
          <select
            value={project.settings.remixable ? 'true' : 'false'}
            onChange={(e) => handleSettingChange('remixable', e.target.value)}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="true">Yes — Others can duplicate and remix your game</option>
            <option value="false">No — Only you can edit or copy this game</option>
          </select>
        </div>
        <div className="flex flex-col">
          <h2>Who can play your game?</h2>
          <select
            value={project.settings.visibility}
            onChange={(e) => handleSettingChange('visibility', e.target.value)}
            className="bg-slate-200! dark:bg-slate-800! rounded-lg p-2 outline-none cursor-pointer"
          >
            <option value="public">Published — Anyone can find and play your game</option>
            <option value="unlisted">
              Unlisted — Only people with the link can play your game
            </option>
            <option value="private">Draft — Only you can play your game</option>
          </select>
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => openModal('sharing')}
            className="w-full flex items-center gap-2 justify-center"
          >
            Share your game link <LinkIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
