import {
  Cartridge,
  Character,
  Place,
  Playthrough,
  QuickstartLine,
  Scene,
  Trigger,
} from '@/app/types';
import { withLLMApi } from '../../utils';
import { interpretAndEdit } from './response';

export interface QuickstartInput {
  conversation: QuickstartLine[];
  userInput: string;
  currentCartridge: Cartridge;
  projectTitle: string;
  currentPlaythrough?: Playthrough;
}

// Instruction types for structured edits
export type EntityType = 'Scene' | 'Character' | 'Place' | 'Trigger' | 'Settings' | 'Style';

export interface CreateInstruction {
  type: 'create';
  entity: EntityType;
  body: Partial<Scene | Character | Place>;
}

export interface CreateTriggerInstruction {
  type: 'create';
  entity: 'Trigger';
  body: Partial<Trigger> & { sceneId: string };
}

export interface EditInstruction {
  type: 'edit';
  entity: EntityType;
  uuid: string;
  body: Partial<Scene | Character | Place | Trigger>;
}

export interface DeleteInstruction {
  type: 'delete';
  entity: EntityType;
  uuid: string;
}

export type Instruction =
  | CreateInstruction
  | CreateTriggerInstruction
  | EditInstruction
  | DeleteInstruction;

export interface InstructionEditOutput {
  type: 'edit';
  instructions: Instruction[];
  editSummary: string;
  message: string;
  suggestions?: string[];
}

export interface TextOutput {
  type: 'text';
  message: string;
  suggestions?: string[];
}

export type QuickstartOutput = InstructionEditOutput | TextOutput;

export async function POST(request: Request) {
  const body = await request.json();
  return withLLMApi<QuickstartInput, QuickstartOutput>(interpretAndEdit, 'quickstart/edit')(
    body,
    request,
  );
}
