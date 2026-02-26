import {
  EyeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTooltip } from './Tooltip';

export type Tip = {
  type: 'help' | 'public' | 'prompt' | 'private';
  tooltip?: string;
};

export default function HelpLabel({ label, tips }: { label: string; tips: Tip[] }) {
  const { showTooltip, hideTooltip } = useTooltip();

  return (
    <div className="flex gap-1 items-center">
      <h2>{label}</h2>
      {tips.map((tip, key) => {
        if (tip.type === 'private') {
          return (
            <LockClosedIcon
              key={key}
              className="w-4 h-4 mb-1 text-slate-500 cursor-help"
              onMouseOver={() => showTooltip(`PRIVATE TO PLAYER: ${tip.tooltip || ''}`)}
              onMouseOut={hideTooltip}
            />
          );
        }

        if (tip.type === 'help') {
          return (
            <InformationCircleIcon
              key={key}
              className="w-4 h-4 mb-1 text-slate-500 cursor-help"
              onMouseOver={() => showTooltip(tip.tooltip || '')}
              onMouseOut={hideTooltip}
            />
          );
        }

        if (tip.type === 'prompt') {
          return (
            <SparklesIcon
              key={key}
              className="w-4 h-4 mb-1 text-slate-500 cursor-help"
              onMouseOver={() =>
                showTooltip(
                  `USED AS PROMPT: ${tip.tooltip || 'The AI narrator will use this in its prompt when generating the game.'}`,
                )
              }
              onMouseOut={hideTooltip}
            />
          );
        }

        if (tip.type === 'public') {
          return (
            <EyeIcon
              key={key}
              className="w-4 h-4 mb-1 text-slate-500 cursor-help"
              onMouseOver={() =>
                showTooltip(
                  `PUBLIC TO PLAYER: ${tip.tooltip || 'The player will be able to see this information.'}`,
                )
              }
              onMouseOut={hideTooltip}
            />
          );
        }

        throw new Error(`Invalid tip type: ${tip.type}`);
      })}
    </div>
  );
}
