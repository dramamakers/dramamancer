'use client';
import Game from '@/components/Game';
import { useProject } from '@/components/Game/ProjectContext';
import PlayDescription from './PlayDescription';
import PlayHeader from './PlayHeader';

export default function PlayContent() {
  const { backgroundColor } = useProject();

  return (
    <div
      className="flex flex-col transition-colors duration-500 ease-in-out bg-slate-100 dark:bg-slate-900 pb-40"
      style={{
        backgroundColor,
      }}
    >
      <PlayHeader />
      <div className="flex gap-6 p-4 flex-col justify-center items-center">
        <div className="flex flex-col gap-4 2xl:max-w-[80%] w-full">
          <div className="flex flex-col gap-4 h-[calc(100vh-100px)] max-h-[800px]">
            <Game />
          </div>
          <PlayDescription />
        </div>
      </div>
    </div>
  );
}
