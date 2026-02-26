import { suggestedGenres } from '@/app/constants';
import { Project } from '@/app/types';
import { Chip } from '@/components/Chip';
import FeatheredScroll from '@/components/FeatheredScroll';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import ProjectCard from './ProjectCard';

const gradientColors = [
  'bg-gradient-to-b from-blue-500/20 to-cyan-500/30 text-blue-700 hover:from-blue-500/30 hover:to-cyan-500/40 dark:from-blue-400/20 dark:to-cyan-400/30 dark:text-blue-300',
  'bg-gradient-to-b from-amber-500/20 to-orange-500/30 text-amber-700 hover:from-amber-500/30 hover:to-orange-500/40 dark:from-amber-400/20 dark:to-orange-400/30 dark:text-amber-300',
  'bg-gradient-to-b from-purple-500/20 to-violet-500/30 text-purple-700 hover:from-purple-500/30 hover:to-violet-500/40 dark:from-purple-400/20 dark:to-violet-400/30 dark:text-purple-300',
  'bg-gradient-to-b from-emerald-500/20 to-green-500/30 text-emerald-700 hover:from-emerald-500/30 hover:to-green-500/40 dark:from-emerald-400/20 dark:to-green-400/30 dark:text-emerald-300',
  'bg-gradient-to-b from-red-500/20 to-rose-500/30 text-red-700 hover:from-red-500/30 hover:to-rose-500/40 dark:from-red-400/20 dark:to-rose-400/30 dark:text-red-300',
  'bg-gradient-to-b from-pink-500/20 to-rose-500/30 text-pink-700 hover:from-pink-500/30 hover:to-rose-500/40 dark:from-pink-400/20 dark:to-rose-400/30 dark:text-pink-300',
  'bg-gradient-to-b from-teal-500/20 to-emerald-500/30 text-teal-700 hover:from-teal-500/30 hover:to-emerald-500/40 dark:from-teal-400/20 dark:to-emerald-400/30 dark:text-teal-300',
  'bg-gradient-to-b from-indigo-500/20 to-blue-500/30 text-indigo-700 hover:from-indigo-500/30 hover:to-blue-500/40 dark:from-indigo-400/20 dark:to-blue-400/30 dark:text-indigo-300',
];

export default function ByGenre({ byGenre }: { byGenre: Record<string, Project[]> }) {
  // Get 5 random default genres + 3 random extras not in defaults
  const { genres, genreColorMap } = useMemo(() => {
    const availableGenres = Object.keys(byGenre).filter((genre) => byGenre[genre].length > 0);

    // Pick 5 random from suggestedGenres that exist in byGenre
    const defaultGenres = suggestedGenres
      .filter((g) => availableGenres.includes(g))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    // Pick 3 random extras not in defaults
    const extras = availableGenres
      .filter((g) => !defaultGenres.includes(g))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const combined = [...defaultGenres, ...extras];

    // Map each genre to a gradient color
    const colorMap: Record<string, string> = {};
    combined.forEach((genre, index) => {
      colorMap[genre] = gradientColors[index % gradientColors.length];
    });
    return { genres: combined, genreColorMap: colorMap };
  }, [byGenre]);

  const [selectedGenre, setSelectedGenre] = useState<string | null>(genres[0]);

  if (genres.length === 0) {
    return null;
  }

  const projects = byGenre[selectedGenre || Object.keys(byGenre)[0]];
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-wrap gap-2 items-center">
        {genres.map((genre) => (
          <Chip
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={twMerge(
              selectedGenre === genre
                ? genreColorMap[genre]
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
            )}
          >
            {genre}
          </Chip>
        ))}
      </div>

      {selectedGenre && (
        <FeatheredScroll>
          {projects.map((project) => (
            <div key={project.id} className="w-48 flex-shrink-0">
              <ProjectCard project={project} />
            </div>
          ))}
        </FeatheredScroll>
      )}
    </div>
  );
}
