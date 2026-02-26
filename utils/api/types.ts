import {
  ActionTrigger,
  Character,
  Playthrough,
  Project,
  Scene,
  Trigger,
  XmlLine,
} from '@/app/types';

export type CheckApiOutputType = {
  activatedTriggerIds: string[];
};

export type CheckApiInputType = {
  possibleTriggers: Record<string, ActionTrigger>;
  lines: XmlLine[];
};

export type HintApiOutputType = {
  lines: XmlLine[];
};

export type HintApiInputType = {
  lines: XmlLine[];
  triggerConditions: string[];
  playerCharacterName: string;
  style: string;
  language: string;
};

export type StepApiOutputType = {
  lines: XmlLine[];
  endName?: string;
};

export type StepApiInputType = {
  project: Project;
  playthrough: Playthrough;
  triggers: Trigger[];
  language: string;
};

export type TranslateApiInputType = {
  lineText: string;
  style: string;
};

export type TranslateApiOutputType = {
  translatedText: string;
};

export type ConditionsApiInputType = {
  scene: Scene;
  characters: Character[];
};

export type ConditionsApiOutputType = {
  conditions: string[];
};
