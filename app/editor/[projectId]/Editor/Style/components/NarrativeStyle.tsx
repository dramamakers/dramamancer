import Textarea from '@/components/Textarea';
import { useEditorProject } from '../../../EditorContext';

export default function NarrativeStyle() {
  const { project, updateProject } = useEditorProject();
  const narrativeStyle = project.cartridge.style.prompt;

  const handleNarrativeStyleChange = (newStyle: string) => {
    updateProject(
      (draft) => {
        draft.cartridge.style.prompt = newStyle;
      },
      {
        message: 'updated style',
        context: JSON.stringify({ style: newStyle }),
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col bg-slate-200 dark:bg-slate-800 rounded-lg p-2">
        <Textarea
          value={narrativeStyle}
          onChange={handleNarrativeStyleChange}
          placeholder={`What instructions should the AI narrator always follow? Use this to enforce game mechanics ("escape room, everything is a social media post"), or a writing tone and style (e.g. "no backstory, informal language") etc.`}
          rows={3}
          maxLength={1000}
        />
      </div>
    </div>
  );
}
