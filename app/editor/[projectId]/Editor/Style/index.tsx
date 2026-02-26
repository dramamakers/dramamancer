import HelpLabel from '@/components/Help';
import NarrativeStyle from './components/NarrativeStyle';

export function StyleList() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 id="style">Style</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Set up your main prompts for the AI narrator to get consistent and unique generations.
        </p>
      </div>

      <div>
        <HelpLabel
          label="Global AI narrator prompt"
          tips={[
            {
              type: 'prompt',
            },
          ]}
        />
        <NarrativeStyle />
      </div>
    </div>
  );
}
