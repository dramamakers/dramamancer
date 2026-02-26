export function getSystemPrompt(): string {
  return `You are a creative game narrator immersing the player in an expansive interactive narrative. Your task is to give the player a "hint" line that suggests 2-4 possible actions the player might take next, without spoiling or being too obvious about conditions that would move the story forward.

Rules:
• Write entirely in 2nd person
• Maintain the mood and atmosphere of the current scene
• Draw attention to environment and current unanswered questions rather than explicit story beats
• Always wrap potential actions in {{curly braces}}

Example responses:
• Alex keeps glancing at their phone while fidgeting with their coffee cup. You could {{ask about what's bothering them}} or {{distract them}}.
• The bookshelf has gaps where volumes 3 and 7 should be. You could {{search other rooms for the missing books}} or {{read the remaining spines}}.
• Something about this place seems to invite closer examination. Looking around, you could {{examine a clock}}, {{examine a painting}}, or {{examine a bookshelf}}. Or you could {{bounce ideas off of Bob}}.
• Your coin purse jingles with 50 gold pieces, and the merchant eyes your rusty sword. You could {{haggle for better gear}} or {{save money for the inn tonight}}.

Keep responses under 150 characters. Keep the actions short and concise within 5 words. Choose a format that works for the particular game (e.g. an escape room would be more environmental; dating sim more character-focused) and maintain immersion in the existing story world.`;
}

export function getUserPrompt({
  triggerConditions,
  style,
  playerCharacterName,
}: {
  triggerConditions: string[];
  style: string;
  playerCharacterName: string;
}): string {
  let basePrompt = `The player=${playerCharacterName} has requested a hint. Generate a single line of narration that ALWAYS suggests 2-4 next steps that the player could take.`;

  if (triggerConditions.length > 0) {
    const filteredConditions = triggerConditions.filter(
      (c) => !c.toLowerCase().includes('(secret)'),
    );
    if (filteredConditions.length > 0) {
      basePrompt += `\n\nAlways ${
        filteredConditions.length >= 4 ? 'pick from' : 'include'
      } these conditions:\n${filteredConditions.join(', ')}`;

      basePrompt += `\n\nThese may contain game spoilers, which you shouldn't be too obvious suggesting if the existing story has not revealed them. For example: The condition "Confront Abby about her secret" could be rephrased to "Abby seems shiftier than usual. You could {{talk to Abby}}.".`;
    }
  }

  if (triggerConditions.length < 4) {
    basePrompt += `\n\nImprovise interesting, unexplored directions for the story to progress forward.`;
  }

  if (style) {
    basePrompt += `\n\nApply these style requirements to ALL narration and dialogue: ${style}`;
  }

  return basePrompt;
}
