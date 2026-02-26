import { END_SCENE_ID, Project, Scene, XmlLine } from '@/app/types';
import { getCharacter, getPlaceById, getPlayerCharacter } from '@/utils/game';

const MAX_LINES_BEFORE_PAUSE = 5;

export function getNumLinesSinceLastPause(previousLines: XmlLine[]) {
  // Work backwards from the last PAUSE=true line
  for (let i = previousLines.length - 1; i >= 0; i--) {
    if (previousLines[i].metadata?.shouldPause) {
      return previousLines.length - i - 1;
    }
  }
  return previousLines.length;
}

export function getSystemPrompt({
  project,
  scene,
  goToSceneId,
}: {
  project: Project;
  scene: Scene;
  goToSceneId?: string;
}): string {
  const playerCharacter = getPlayerCharacter(project);
  const place = scene.placeId ? getPlaceById(project, scene.placeId) : undefined;
  return `You are an expert dungeon master whose task is to write the next line of the story. Your job is to craft a dynamic and immersive game world for the player character, who is acting as ${playerCharacter.name}. You may ONLY control the narrator and NPCs in this scene.

${scene.prompt ? `IMPORTANT: Follow the author's instructions for the scene here: ${scene.prompt}` : ''}

Scene details:
${place ? `Place: ${place.name} - ${place.description}` : ''}
NPCs: ${scene.characterIds
    .filter((c) => c !== playerCharacter.uuid)
    .map((c) => {
      const character = getCharacter(project, c);
      return `${character.name}${character.description ? `: ${character.description}` : ''}`;
    })
    .join(',')}

ALWAYS format your output as:
LINE: Any narration before the dialogue. <ch name="Name">(Action or body language) Spoken dialogue.</ch> Any narration after the dialogue.
${goToSceneId ? 'PAUSE: false' : 'PAUSE: [true|false]'}

NEVER generate any actions/dialogue for ${playerCharacter.name}. NEVER generate characters that are not currently in this scene, unless it makes sense for them to enter it (i.e. interacting with a shopkeeper). If you want ${playerCharacter.name} to act, react, or speak, set PAUSE=true. If building up the plot, environment, or characters, set to false. Try to only PAUSE=true after enough interesting things have happened.

Rules for LINE:
• NEVER generate any actions/dialogue for ${playerCharacter.name}
• Line should be <250 characters, Plan should be <100 characters
• To add a new character, come up with a name that does not yet exist in the story ("Charles" or "Someone in the shadows")
• Every line should "yes and" the previous to move the story forward in specific ways
• Implement previous unfulfilled PLANs if good timing`;
}

export function getUserPrompt({
  project,
  scene,
  goToSceneId,
  triggerNarratives,
  previousLines,
}: {
  project: Project;
  scene: Scene;
  goToSceneId?: string;
  triggerNarratives: string[];
  previousLines: XmlLine[];
}): string {
  const place = scene.placeId ? getPlaceById(project, scene.placeId) : undefined;
  const style = project.cartridge.style.prompt;
  const playerCharacter = getPlayerCharacter(project);
  const isEnding = goToSceneId === END_SCENE_ID;
  const numLinesSinceLastPause = getNumLinesSinceLastPause(previousLines);

  let basePrompt = `Generate the next line of the story.

${goToSceneId !== undefined ? `The scene will ${isEnding ? 'end' : 'change'} after this line. Ensure this line provides a satisfying ${isEnding ? 'ending' : 'transition'}. As needed, take extra lines and characters to do so.` : ''}

${style ? `Apply these style requirements to ALL narration and dialogue: ${style}` : ''}`;

  // Handle triggered narratives - highest priority
  if (triggerNarratives && triggerNarratives.length > 0) {
    basePrompt += `\n\n--- IMPORTANT ---

In generating the next line, make sure to incorporate the following narrative elements naturally:
${triggerNarratives.map((narrative) => `• ${narrative}`).join('\n')}

These events MUST happen. Weave them into the story in a way that feels organic and maintains character authenticity. Use the PLAN section as needed to help incorporate these elements.`;
  }

  const lastLine = previousLines[previousLines.length - 1];
  if (lastLine.role === 'user') {
    basePrompt += `\n\n--- TASK ---
    
The player is acting as ${playerCharacter.name} and has just performed the action: ${lastLine.text}
ALWAYS respond to the player's action immediately with narration and/or NPCs to progress the story in interesting and specific ways.

Example responses:
If given the action: (investigate)
Respond with:
LINE: <ch name="Narrator">What would you like to investigate? In the room, you can see Bob and a picture on the wall.</ch>
PAUSE: true

If given the action: (look at the picture)
Respond with:
LINE: <ch name="Narrator">${playerCharacter.name} takes a step closer to the picture on the wall. The picture is a portrait of a young woman with long, flowing hair and a serene expression. There's something glistening in her eyes.</ch>
PAUSE: false

If given the action: (run away)
Respond with:
LINE: <ch name="Narrator">${playerCharacter.name} runs away from the room, the door slamming behind them.</ch>
PAUSE: false

If given the action: i hate you!
Respond with:
LINE: <ch name="Narrator">${playerCharacter.name}'s words reverberate out onto the street.</ch><ch name="Random man on the street">(angry) "I hate you too!"</ch><ch name="Narrator">The man walks away, shaking his head.</ch>
PAUSE: false
`;
  } else {
    basePrompt += `\n\n--- TASK ---
Generate the next line in an interesting, progressive way, setting up a satisfying player arc. ${numLinesSinceLastPause > MAX_LINES_BEFORE_PAUSE ? `You MUST set PAUSE=true. Set up an engaging decision point for the player.` : 'Always set PAUSE=false.'} If you want the player as ${playerCharacter.name} to act, do not act on their behalf; instead, set PAUSE=true.

ALWAYS "yes and" yourself and progress the story in different, specific, and interesting ways. You can make the non-player characters act and affect the environment or other characters. You can also add a new character or change the situation.

Example responses:
LINE: <ch name="Narrator">The bus hummed steadily along its route, Alex sitting quietly beside Sam, the picture of an ordinary student—yet Martinez's eyes searched for cracks beneath the calm.</ch>
PAUSE: false

LINE: <ch name="Narrator">Detective Kane arranges three pieces of paper in front of Alex.</ch><ch name="Kane">(casually, almost distracted) "Kane, do you know / love apples? / Gods of Death." That was the order, wasn't it? It doesn't make any sense.</ch>
PAUSE: true

LINE: <ch name="Kane">(examining a sugar cube with exaggerated interest) Miss Chen, do you believe in coincidences? I find they rarely exist.</ch>
PAUSE: false`;
  }

  return (
    basePrompt +
    `\n\n--- REMEMBER ---

Scene details:
${place ? `Place: ${place.name} - ${place.description}` : ''}
${scene.prompt ? `Follow the author's instructions for the scene here: ${scene.prompt}` : ''}

NEVER generate any actions/dialogue for ${playerCharacter.name}. ${
      numLinesSinceLastPause > MAX_LINES_BEFORE_PAUSE
        ? `Always set PAUSE=true`
        : `If you want ${playerCharacter.name} to act or speak, set PAUSE=true. Otherwise, continue building up the story. Try to only PAUSE=true after enough interesting things have happened.`
    }`
  );
}
