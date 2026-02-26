import { ActionTrigger, Cartridge, FallbackTrigger } from '@/app/types';
import { applyInstructions } from '../processor';
import { EditInstruction, Instruction } from '../route';

describe('Instruction Processor', () => {
  const mockCartridge: Cartridge = {
    scenes: [
      {
        uuid: 'sc-abc123',
        title: 'Test Scene',
        script: [],
        characterIds: ['ch-char1'],
        triggers: [
          {
            uuid: 'tr-abc123-trigger1',
            type: 'action',
            condition: 'test condition',
            narrative: 'test narrative',
          },
        ],
      },
    ],
    characters: [
      {
        uuid: 'ch-char1',
        name: 'Alice',
        description: 'Test character',
        sprites: {},
      },
    ],
    places: [
      {
        uuid: 'pl-place1',
        name: 'Test Place',
        description: 'A test location',
        sprites: {},
      },
    ],
    style: {
      sref: '',
      prompt: '',
    },
  };

  describe('Trigger UUID parsing', () => {
    it('should correctly edit a trigger by extracting scene ID from trigger UUID', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Trigger',
          uuid: 'tr-abc123-trigger1',
          body: {
            condition: 'updated condition',
            narrative: 'updated narrative',
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect((result.scenes[0].triggers[0] as ActionTrigger).condition).toBe('updated condition');
      expect(result.scenes[0].triggers[0].narrative).toBe('updated narrative');
    });

    it('should correctly delete a trigger by extracting scene ID from trigger UUID', () => {
      const instructions: Instruction[] = [
        {
          type: 'delete',
          entity: 'Trigger',
          uuid: 'tr-abc123-trigger1',
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.scenes[0].triggers).toHaveLength(0);
    });

    it('should throw error for invalid trigger UUID format', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Trigger',
          uuid: 'invalid-uuid',
          body: {
            condition: 'test',
          },
        },
      ];

      expect(() => applyInstructions(mockCartridge, instructions)).toThrow(
        `Invalid uuid: ${(instructions[0] as EditInstruction).uuid}`,
      );
    });

    it('should throw error when scene not found for trigger', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Trigger',
          uuid: 'tr-nonexistent-trigger1',
          body: {
            condition: 'test',
          },
        },
      ];

      expect(() => applyInstructions(mockCartridge, instructions)).toThrow(
        'Scene not found for trigger',
      );
    });
  });

  describe('Create operations', () => {
    it('should create a new character', () => {
      const instructions: Instruction[] = [
        {
          type: 'create',
          entity: 'Character',
          body: {
            name: 'Bob',
            description: 'New character',
            sprites: {},
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.characters).toHaveLength(2);
      expect(result.characters[1].name).toBe('Bob');
      expect(result.characters[1].uuid).toMatch(/^ch-/);
    });

    it('should create a new scene', () => {
      const instructions: Instruction[] = [
        {
          type: 'create',
          entity: 'Scene',
          body: {
            title: 'New Scene',
            script: [],
            characterIds: [],
            triggers: [],
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.scenes).toHaveLength(2);
      expect(result.scenes[1].title).toBe('New Scene');
      expect(result.scenes[1].uuid).toMatch(/^sc-/);
    });

    it('should create a new trigger in a scene', () => {
      const instructions: Instruction[] = [
        {
          type: 'create',
          entity: 'Trigger',
          body: {
            type: 'action',
            condition: 'new condition',
            narrative: 'new narrative',
            sceneId: 'sc-abc123',
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);
      expect(result.scenes[0].triggers).toHaveLength(2);
      expect((result.scenes[0].triggers[1] as ActionTrigger).condition).toBe('new condition');
      expect(result.scenes[0].triggers[1].uuid).toMatch(/^tr-abc123-/);
    });
  });

  describe('Edit operations', () => {
    it('should edit a character', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Character',
          uuid: 'ch-char1',
          body: {
            name: 'Alice Updated',
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.characters[0].name).toBe('Alice Updated');
      expect(result.characters[0].description).toBe('Test character'); // Should preserve other fields
    });

    it('should edit a scene', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Scene',
          uuid: 'sc-abc123',
          body: {
            title: 'Updated Scene',
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.scenes[0].title).toBe('Updated Scene');
    });

    it('should edit a place', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Place',
          uuid: 'pl-place1',
          body: {
            name: 'Updated Place',
          },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.places[0].name).toBe('Updated Place');
    });
  });

  describe('Delete operations', () => {
    it('should delete a character and remove from scenes', () => {
      const instructions: Instruction[] = [
        {
          type: 'delete',
          entity: 'Character',
          uuid: 'ch-char1',
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.characters).toHaveLength(0);
      expect(result.scenes[0].characterIds).toHaveLength(0); // Should be removed from scene
    });

    it('should delete a scene', () => {
      const instructions: Instruction[] = [
        {
          type: 'delete',
          entity: 'Scene',
          uuid: 'sc-abc123',
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.scenes).toHaveLength(0);
    });

    it('should delete a place', () => {
      const instructions: Instruction[] = [
        {
          type: 'delete',
          entity: 'Place',
          uuid: 'pl-place1',
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.places).toHaveLength(0);
    });
  });

  describe('Multiple instructions', () => {
    it('should apply multiple instructions in order', () => {
      const instructions: Instruction[] = [
        {
          type: 'edit',
          entity: 'Character',
          uuid: 'ch-char1',
          body: { name: 'Alice Updated' },
        },
        {
          type: 'create',
          entity: 'Character',
          body: { name: 'Bob', description: 'New character', sprites: {} },
        },
        {
          type: 'edit',
          entity: 'Scene',
          uuid: 'sc-abc123',
          body: { title: 'Updated Scene' },
        },
      ];

      const result = applyInstructions(mockCartridge, instructions);

      expect(result.characters[0].name).toBe('Alice Updated');
      expect(result.characters).toHaveLength(2);
      expect(result.characters[1].name).toBe('Bob');
      expect(result.scenes[0].title).toBe('Updated Scene');
    });
  });

  describe('Default values', () => {
    describe('Triggers', () => {
      it('should set default k value for fallback triggers when created without k', () => {
        const instructions: Instruction[] = [
          {
            type: 'create',
            entity: 'Trigger',
            body: {
              sceneId: 'sc-abc123',
              type: 'fallback',
              narrative: 'Fallback narrative',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.scenes[0].triggers).toHaveLength(2);
        const newTrigger = result.scenes[0].triggers[1];
        expect(newTrigger.type).toBe('fallback');
        expect((newTrigger as FallbackTrigger).k).toBe(1);
      });

      it('should set default k value when editing trigger type to fallback', () => {
        const instructions: Instruction[] = [
          {
            type: 'edit',
            entity: 'Trigger',
            uuid: 'tr-abc123-trigger1',
            body: {
              type: 'fallback',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        const trigger = result.scenes[0].triggers[0];
        expect(trigger.type).toBe('fallback');
        expect((trigger as FallbackTrigger).k).toBe(1);
      });

      it('should preserve existing k value when editing fallback trigger', () => {
        const cartridgeWithFallback: Cartridge = {
          ...mockCartridge,
          scenes: [
            {
              ...mockCartridge.scenes[0],
              triggers: [
                {
                  uuid: 'tr-abc123-trigger1',
                  type: 'fallback',
                  narrative: 'test',
                  k: 5,
                },
              ],
            },
          ],
        };

        const instructions: Instruction[] = [
          {
            type: 'edit',
            entity: 'Trigger',
            uuid: 'tr-abc123-trigger1',
            body: {
              narrative: 'updated narrative',
            },
          },
        ];

        const result = applyInstructions(cartridgeWithFallback, instructions);

        const trigger = result.scenes[0].triggers[0];
        expect((trigger as FallbackTrigger).k).toBe(5);
      });
    });

    describe('Scenes', () => {
      it('should preserve empty arrays when editing scene without those fields', () => {
        const instructions: Instruction[] = [
          {
            type: 'edit',
            entity: 'Scene',
            uuid: 'sc-abc123',
            body: {
              title: 'Updated Title',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.scenes[0].script).toEqual([]);
        expect(result.scenes[0].characterIds).toEqual(['ch-char1']);
        expect(result.scenes[0].triggers).toBeDefined();
      });

      it('should initialize missing arrays when creating scene without them', () => {
        const instructions: Instruction[] = [
          {
            type: 'create',
            entity: 'Scene',
            body: {
              title: 'Minimal Scene',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.scenes[1].script).toEqual([]);
        expect(result.scenes[1].characterIds).toEqual([]);
        expect(result.scenes[1].triggers).toEqual([]);
      });
    });

    describe('Characters', () => {
      it('should preserve sprites when editing character without sprites field', () => {
        const instructions: Instruction[] = [
          {
            type: 'edit',
            entity: 'Character',
            uuid: 'ch-char1',
            body: {
              name: 'New Name',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.characters[0].sprites).toEqual({});
      });

      it('should initialize empty sprites object when creating character without sprites', () => {
        const instructions: Instruction[] = [
          {
            type: 'create',
            entity: 'Character',
            body: {
              name: 'Bob',
              description: 'A character without sprites',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.characters[1].sprites).toEqual({});
      });
    });

    describe('Places', () => {
      it('should preserve sprites when editing place without sprites field', () => {
        const instructions: Instruction[] = [
          {
            type: 'edit',
            entity: 'Place',
            uuid: 'pl-place1',
            body: {
              name: 'New Place Name',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.places[0].sprites).toEqual({});
      });

      it('should initialize empty sprites object when creating place without sprites', () => {
        const instructions: Instruction[] = [
          {
            type: 'create',
            entity: 'Place',
            body: {
              name: 'Coffee Shop',
              description: 'A cozy place',
            },
          },
        ];

        const result = applyInstructions(mockCartridge, instructions);

        expect(result.places[1].sprites).toEqual({});
      });
    });
  });
});
