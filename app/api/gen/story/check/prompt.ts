import { ActionTrigger } from '@/app/types';

export function getCheckPrompt({
  possibleTriggers,
}: {
  possibleTriggers: Record<string /* id */, ActionTrigger>;
}): string {
  return `You are a condition checker for an interactive text game. Your ONLY task is to determine if any conditions have been EXACTLY met based on the current game state.

Trigger conditions to check:
${Object.entries(possibleTriggers)
  .map(([_id, trigger], index) => `${index}: ${trigger.condition}`)
  .join('\n')}

Rules:
- Only match EXACTLY completed actions, not partial/similar/planned ones
- Character names and details must match exactly
- No hypotheticals or thoughts

Examples of INCORRECT triggering:
- Condition: "player enters library" ≠ "player walks toward library"
- Condition: "Alice talks to Bob" ≠ "Alice sees Bob"
- Condition: "find the key" ≠ "look for the key"
- Condition: "character runs away" ≠ "character thinks about running away"

Format your response exactly as:
TRIGGERS:
[Comma-separated list of triggered indices, or NONE if no triggers met]

Example response 1:
TRIGGERS:
0, 4

Example response 2:
TRIGGERS:
NONE`;
}
