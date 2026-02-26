import { DisplayLine, Scene } from '@/app/types';
import { TriggerManager } from '../../hooks/TriggerManager';

describe('TriggerManager', () => {
  const mockScene: Scene = {
    uuid: '0',
    title: 'Test Scene',
    background: { imageUrl: 'test.jpg', type: 'image' },
    setting: 'A test room',
    openingLine: 'You enter a test room.',
    characterIds: ['1'],
    triggers: [
      {
        type: 'action',
        condition: 'player examines the door',
        narrative: 'You find a mysterious key.',
        goToSceneId: '1',
        uuid: '0',
      },
      {
        type: 'action',
        condition: 'player talks to Alice',
        narrative: 'Alice reveals a secret.',
        uuid: '1',
        eventImage: {
          type: 'image',
          imageUrl: 'secret.jpg',
          loading: false,
        },
      },
      {
        type: 'fallback',
        k: 2,
        narrative: 'Time passes and you grow restless.',
        uuid: '2',
      },
    ],
  };

  describe('Initialization', () => {
    it('should initialize trigger states correctly', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'First action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const states = triggerManager.getAllTriggerStates();

      expect(Object.keys(states)).toHaveLength(3);
      expect(states[0].trigger.type).toBe('action');
      expect(states[0].consumed).toBe(false);
      expect(states[1].trigger.type).toBe('action');
      expect(states[1].consumed).toBe(false);
      expect(states[2].trigger.type).toBe('fallback');
      expect(states[2].consumed).toBe(false);
      expect(states[2].turnsLeft).toBe(1); // k=2, one player line so far
    });

    it('should mark triggers as consumed from previous lines', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'First action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Response',
          characterName: 'Alice',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Second action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const states = triggerManager.getAllTriggerStates();

      expect(states[0].consumed).toBe(true); // First trigger was activated
      expect(states[1].consumed).toBe(false);
      expect(states[2].consumed).toBe(false);
      expect(states[2].turnsLeft).toBe(0); // k=2, two player lines
    });

    it('should add fallback triggers to pending when they expire', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'First action', characterName: 'Player' },
        { type: 'character', text: 'Response', characterName: 'Alice' },
        { type: 'player', text: 'Second action', characterName: 'Player' },
        { type: 'character', text: 'Response', characterName: 'Alice' },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].narrative).toBe('Time passes and you grow restless.');
    });

    it('should handle activatedTriggerKeys in the last line', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        {
          type: 'player',
          text: 'Action',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['1'] },
        },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers[0].narrative).toBe('Alice reveals a secret.');
    });
  });

  describe('getActivatedNarratives', () => {
    it('should return narratives and consume triggers', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        {
          type: 'player',
          text: 'Action',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['0', '1'] },
        },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers).toHaveLength(2);
      expect(activatedTriggers[0].narrative).toBe('You find a mysterious key.');
      expect(activatedTriggers[1].narrative).toBe('Alice reveals a secret.');
      expect(activatedTriggers[0].goToSceneId).toBe('1'); // From first trigger

      // Should be consumed after getting narratives
      const states = triggerManager.getAllTriggerStates();
      expect(states[0].consumed).toBe(true);
      expect(states[1].consumed).toBe(true);
    });

    it('should prioritize action triggers for scene transitions', () => {
      const sceneWithBothTriggerTypes: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Fallback narrative',
            goToSceneId: '2',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'test condition',
            narrative: 'Action narrative',
            goToSceneId: '3',
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        {
          type: 'player',
          text: 'Action',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['1'] },
        },
      ];

      const triggerManager = new TriggerManager(sceneWithBothTriggerTypes.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers[0].goToSceneId).toBe('3'); // Action trigger scene id takes precedence
    });

    it('should clear pending triggers after getting narratives', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        {
          type: 'player',
          text: 'Action',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['0'] },
        },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);

      // First call should return narratives
      const first = triggerManager.getActivatedTriggers();
      expect(first).toHaveLength(1);

      // Second call should return empty (pending cleared)
      const second = triggerManager.getActivatedTriggers();
      expect(second).toHaveLength(0);
    });
  });

  describe('possibleTriggers', () => {
    it('should return only non-consumed action triggers', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Response',
          characterName: 'Alice',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'character', text: 'Follow up', characterName: 'Alice' },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Should only include non-consumed action triggers
      const keys = Object.keys(possibleTriggers);
      expect(keys).toContain('1'); // Second action trigger should be available
      expect(keys).not.toContain('0'); // First trigger was consumed (in line 2, which is not the last line now)
      expect(keys).not.toContain('2'); // Fallback triggers not included
      expect(possibleTriggers['1'].condition).toBe('player talks to Alice');
    });

    it('should not include fallback triggers', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Should only include action triggers, not fallback
      expect(Object.keys(possibleTriggers)).toHaveLength(2);
      expect(possibleTriggers['0'].type).toBe('action');
      expect(possibleTriggers['1'].type).toBe('action');
    });
  });

  describe('getActivatedTriggers', () => {
    it('should return full trigger objects for given keys', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const triggers = triggerManager.getTriggers(['0', '1']);

      expect(triggers).toHaveLength(2);
      expect(triggers[0].narrative).toBe('You find a mysterious key.');
      expect(triggers[1].narrative).toBe('Alice reveals a secret.');
      expect(triggers[1].eventImage).toStrictEqual({
        type: 'image',
        imageUrl: 'secret.jpg',
        loading: false,
      });
    });

    it('should filter out invalid trigger keys', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);
      const triggers = triggerManager.getTriggers(['0', '999', '1']);

      expect(triggers).toHaveLength(2); // Invalid key 999 filtered out
      expect(triggers[0].narrative).toBe('You find a mysterious key.');
      expect(triggers[1].narrative).toBe('Alice reveals a secret.');
    });
  });

  describe('Fallback Trigger Edge Cases', () => {
    it('should handle fallback trigger with k=0', () => {
      const sceneWithImmediateFallback: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 0,
            narrative: 'Immediate fallback',
            uuid: '0',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(sceneWithImmediateFallback.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers[0].narrative).toBe('Immediate fallback');
    });

    it('should not activate consumed fallback triggers', () => {
      const sceneWithFallback: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Fallback narrative',
            uuid: '0',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Response',
          characterName: 'Alice',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Another action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithFallback.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers).toHaveLength(0); // Should not activate consumed fallback
    });

    it('should not activate consumed fallback triggers', () => {
      const sceneWithFallback: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Fallback narrative',
            uuid: '0',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Response',
          characterName: 'Alice',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Another action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithFallback.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers).toHaveLength(0); // Should not activate consumed fallback
    });

    it('should activate fallback trigger scene transitions when only fallback triggers fire', () => {
      const sceneWithFallbackSceneTransition: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Time passes and you decide to move on.',
            goToSceneId: '5',
            uuid: '0',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'First action', characterName: 'Player' },
        { type: 'character', text: 'Response', characterName: 'Alice' },
      ];

      const triggerManager = new TriggerManager(sceneWithFallbackSceneTransition.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers[0].narrative).toBe('Time passes and you decide to move on.');
      expect(activatedTriggers[0].goToSceneId).toBe('5'); // Should transition to scene 5
    });

    it('should not activate consumed fallback triggers', () => {
      const sceneWithFallback: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Fallback narrative',
            uuid: '0',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Response',
          characterName: 'Alice',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Another action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithFallback.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      expect(activatedTriggers).toHaveLength(0); // Should not activate consumed fallback
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty scenes', () => {
      const emptyScene: Scene = {
        ...mockScene,
        triggers: [],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(emptyScene.triggers, lines);
      const states = triggerManager.getAllTriggerStates();
      const possibleTriggers = triggerManager.possibleTriggers();

      expect(Object.keys(states)).toHaveLength(0);
      expect(Object.keys(possibleTriggers)).toHaveLength(0);
    });

    it('should handle invalid trigger keys gracefully', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
      ];

      const triggerManager = new TriggerManager(mockScene.triggers, lines);

      expect(() => {
        triggerManager.getTriggers(['999']);
      }).not.toThrow();

      const triggers = triggerManager.getTriggers(['999']);
      expect(triggers).toHaveLength(0);
    });
  });

  describe('Conditional Trigger Dependencies', () => {
    const sceneWithDependentTriggers: Scene = {
      ...mockScene,
      triggers: [
        {
          type: 'action' as const,
          condition: 'player examines the door',
          narrative: 'You find a mysterious key.',
          uuid: '0',
        },
        {
          type: 'action' as const,
          condition: 'player uses the key',
          narrative: 'The door creaks open.',
          dependsOnTriggerIds: ['0'], // Depends on first trigger
          uuid: '1',
        },
        {
          type: 'action' as const,
          condition: 'player enters the room',
          narrative: 'You discover a treasure chest.',
          dependsOnTriggerIds: ['0', '1'], // Depends on both previous triggers
          uuid: '2',
        },
        {
          type: 'action' as const,
          condition: 'player always available',
          narrative: 'This trigger has no dependencies.',
          uuid: '3',
        },
      ],
    };

    it('should not include dependent triggers in possibleTriggers when dependencies not met', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Look around', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithDependentTriggers.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Only triggers without dependencies or with satisfied dependencies should be available
      expect(Object.keys(possibleTriggers)).toHaveLength(2);
      expect(possibleTriggers['0']).toBeDefined(); // No dependencies
      expect(possibleTriggers['3']).toBeDefined(); // No dependencies
      expect(possibleTriggers['1']).toBeUndefined(); // Depends on trigger 0
      expect(possibleTriggers['2']).toBeUndefined(); // Depends on triggers 0 and 1
    });

    it('should include dependent triggers when dependencies are satisfied', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Examine door', characterName: 'Player' },
        {
          type: 'character',
          text: 'You find a key',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Use key', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithDependentTriggers.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Now trigger 1 should be available since trigger 0 was consumed
      expect(Object.keys(possibleTriggers)).toHaveLength(2);
      expect(possibleTriggers['1']).toBeDefined(); // Now available
      expect(possibleTriggers['3']).toBeDefined(); // Still available
      expect(possibleTriggers['0']).toBeUndefined(); // Already consumed
      expect(possibleTriggers['2']).toBeUndefined(); // Still needs trigger 1
    });

    it('should include all dependent triggers when all dependencies are satisfied', () => {
      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Examine door', characterName: 'Player' },
        {
          type: 'character',
          text: 'You find a key',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Use key', characterName: 'Player' },
        {
          type: 'character',
          text: 'Door opens',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['1'] },
        },
        { type: 'player', text: 'Enter room', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithDependentTriggers.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Now trigger 2 should be available since both triggers 0 and 1 were consumed
      expect(Object.keys(possibleTriggers)).toHaveLength(2);
      expect(possibleTriggers['2']).toBeDefined(); // Now available
      expect(possibleTriggers['3']).toBeDefined(); // Still available
      expect(possibleTriggers['0']).toBeUndefined(); // Already consumed
      expect(possibleTriggers['1']).toBeUndefined(); // Already consumed
    });

    it('should handle circular dependencies gracefully', () => {
      const sceneWithCircularDeps: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'trigger A',
            narrative: 'A happens',
            dependsOnTriggerIds: ['1'], // Depends on B
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'trigger B',
            narrative: 'B happens',
            dependsOnTriggerIds: ['0'], // Depends on A
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithCircularDeps.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Neither trigger should be available due to circular dependency
      expect(Object.keys(possibleTriggers)).toHaveLength(0);
    });

    it('should handle invalid dependency IDs gracefully', () => {
      const sceneWithInvalidDeps: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'valid trigger',
            narrative: 'This works',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'invalid dependency trigger',
            narrative: 'This has invalid deps',
            dependsOnTriggerIds: ['999'], // Invalid trigger ID
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithInvalidDeps.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Only the valid trigger should be available
      expect(Object.keys(possibleTriggers)).toHaveLength(1);
      expect(possibleTriggers['0']).toBeDefined();
      expect(possibleTriggers['1']).toBeUndefined(); // Invalid dependency
    });

    it('should handle mixed fallback and action trigger dependencies', () => {
      const sceneWithMixedTriggers: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'fallback',
            k: 1,
            narrative: 'Time passes',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'after time passes',
            narrative: 'Something happens after time',
            dependsOnTriggerIds: ['0'], // Depends on fallback trigger
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Wait', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithMixedTriggers.triggers, lines);

      // First get activated narratives to consume the fallback trigger
      const activatedTriggers = triggerManager.getActivatedTriggers();
      expect(activatedTriggers[0].narrative).toBe('Time passes');

      // Now check possible triggers - the dependent action trigger should be available
      const possibleTriggers = triggerManager.possibleTriggers();
      expect(Object.keys(possibleTriggers)).toHaveLength(1);
      expect(possibleTriggers['1']).toBeDefined();
    });

    it('should handle partial dependency satisfaction for triggers with multiple dependencies', () => {
      const sceneWithPartialDeps: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'trigger A',
            narrative: 'A happens',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'trigger B',
            narrative: 'B happens',
            uuid: '1',
          },
          {
            type: 'action' as const,
            condition: 'trigger C needs both A and B',
            narrative: 'C happens after both A and B',
            dependsOnTriggerIds: ['0', '1'], // Depends on both A and B
            uuid: '2',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Trigger A', characterName: 'Player' },
        {
          type: 'character',
          text: 'A triggered',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Try to trigger C', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithPartialDeps.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Only trigger B should be available (A is consumed, C needs both A and B)
      expect(Object.keys(possibleTriggers)).toHaveLength(1);
      expect(possibleTriggers['1']).toBeDefined(); // B is available
      expect(possibleTriggers['0']).toBeUndefined(); // A is consumed
      expect(possibleTriggers['2']).toBeUndefined(); // C needs both A and B, but only A is satisfied
    });

    it('should handle multi-level trigger dependencies (A -> B -> C)', () => {
      const sceneWithChainDeps: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'first trigger',
            narrative: 'First action',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'second trigger',
            narrative: 'Second action',
            dependsOnTriggerIds: ['0'], // Depends on first
            uuid: '1',
          },
          {
            type: 'action' as const,
            condition: 'third trigger',
            narrative: 'Third action',
            dependsOnTriggerIds: ['1'], // Depends on second
            uuid: '2',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'First action', characterName: 'Player' },
        {
          type: 'character',
          text: 'First done',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['0'] },
        },
        { type: 'player', text: 'Second action', characterName: 'Player' },
        {
          type: 'character',
          text: 'Second done',
          characterName: 'Narrator',
          metadata: { activatedTriggerIds: ['1'] },
        },
        { type: 'player', text: 'Ready for third', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithChainDeps.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Only the third trigger should be available now
      expect(Object.keys(possibleTriggers)).toHaveLength(1);
      expect(possibleTriggers['2']).toBeDefined(); // Third trigger available
      expect(possibleTriggers['0']).toBeUndefined(); // First consumed
      expect(possibleTriggers['1']).toBeUndefined(); // Second consumed
    });

    it('should handle self-dependency gracefully', () => {
      const sceneWithSelfDep: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'normal trigger',
            narrative: 'Normal action',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'self-dependent trigger',
            narrative: 'This depends on itself',
            dependsOnTriggerIds: ['1'], // Depends on itself
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Action', characterName: 'Player' },
      ];

      const triggerManager = new TriggerManager(sceneWithSelfDep.triggers, lines);
      const possibleTriggers = triggerManager.possibleTriggers();

      // Only the normal trigger should be available (self-dependent trigger can never be satisfied)
      expect(Object.keys(possibleTriggers)).toHaveLength(1);
      expect(possibleTriggers['0']).toBeDefined();
      expect(possibleTriggers['1']).toBeUndefined(); // Self-dependent trigger unavailable
    });

    it('should handle dependencies with activated triggers in the same turn', () => {
      const sceneWithSameTurnDeps: Scene = {
        ...mockScene,
        triggers: [
          {
            type: 'action' as const,
            condition: 'first trigger',
            narrative: 'First happens',
            uuid: '0',
          },
          {
            type: 'action' as const,
            condition: 'dependent trigger',
            narrative: 'Dependent happens',
            dependsOnTriggerIds: ['0'],
            uuid: '1',
          },
        ],
      };

      const lines: DisplayLine[] = [
        { type: 'narration', text: 'Scene start', metadata: { sceneId: '0' } },
        {
          type: 'player',
          text: 'Multiple triggers',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['0', '1'] }, // Both triggers in same turn
        },
      ];

      const triggerManager = new TriggerManager(sceneWithSameTurnDeps.triggers, lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      // Both narratives should be activated even though they have dependency relationship
      expect(activatedTriggers).toHaveLength(2);
      expect(activatedTriggers[0].narrative).toBe('First happens');
      expect(activatedTriggers[1].narrative).toBe('Dependent happens');

      // Both should be consumed
      const states = triggerManager.getAllTriggerStates();
      expect(states[0].consumed).toBe(true);
      expect(states[1].consumed).toBe(true);
    });
  });

  describe('Scene slicing with deriveSceneIdFromLines', () => {
    it('should only consider lines from the current scene for fallback k counting', () => {
      const sceneWithFallback: Scene = {
        ...mockScene,
        triggers: [{ type: 'fallback', k: 1, narrative: 'Fallback for current scene', uuid: '0' }],
      };

      const lines: DisplayLine[] = [
        // Scene 0 content
        { type: 'narration', text: 'S0 start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Old player action', characterName: 'Player' },
        { type: 'character', text: 'Old response', characterName: 'Alice' },
        // Scene 1 starts here
        { type: 'narration', text: 'S1 start', metadata: { sceneId: '1' } },
        { type: 'player', text: 'Current action', characterName: 'Player' },
      ];

      // TriggerManager is created with only sceneLines from current scene (scene 1),
      // so fallback k should see exactly one player line and fire now
      const triggerManager = new TriggerManager(sceneWithFallback.triggers, [
        lines[3], // S1 start
        lines[4], // player line in S1
      ]);

      const activatedTriggers = triggerManager.getActivatedTriggers();
      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].narrative).toBe('Fallback for current scene');
    });
  });

  describe('Multi-scene scenario with ending triggers', () => {
    it('should handle trigger to end from second scene with activatedTriggerIds', () => {
      // Scene 2 with an action trigger that goes to the end
      const sceneWithEndingTrigger: Scene = {
        uuid: '2',
        title: 'Final Scene',
        imageUrl: 'final.jpg',
        setting: 'The end approaches',
        openingLine: 'You stand at the precipice of destiny.',
        characterIds: ['1'],
        triggers: [
          {
            type: 'action' as const,
            condition: 'player makes final choice',
            narrative: 'You take the final step.',
            goToSceneId: 'end', // Should go to END_SCENE_ID
            endingName: 'The Final Ending',
            uuid: 'ending-trigger',
          },
        ],
      };

      // Lines representing a journey through multiple scenes
      const lines: DisplayLine[] = [
        // Scene 0
        { type: 'narration', text: 'Scene 0 start', metadata: { sceneId: '0' } },
        { type: 'player', text: 'Start action', characterName: 'Player' },
        { type: 'character', text: 'Response', characterName: 'Alice' },

        // Transition to Scene 1
        { type: 'narration', text: 'Scene 1 start', metadata: { sceneId: '1' } },
        { type: 'player', text: 'Middle action', characterName: 'Player' },
        { type: 'character', text: 'Response', characterName: 'Alice' },

        // Transition to Scene 2 (current scene)
        { type: 'narration', text: 'Scene 2 start', metadata: { sceneId: '2' } },
        { type: 'player', text: 'Final choice', characterName: 'Player' },
        {
          type: 'player',
          text: 'I choose to end it all',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['ending-trigger'] }, // This trigger should fire
        },
      ];

      // TriggerManager should be created with only lines from current scene (scene 2)
      const currentSceneLines = [
        lines[6], // Scene 2 start
        lines[7], // First player action in scene 2
        lines[8], // Player action with activatedTriggerIds
      ];

      const triggerManager = new TriggerManager(sceneWithEndingTrigger.triggers, currentSceneLines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      // Should return the ending trigger
      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].uuid).toBe('ending-trigger');
      expect(activatedTriggers[0].goToSceneId).toBe('end');
      expect(activatedTriggers[0].endingName).toBe('The Final Ending');
      expect(activatedTriggers[0].narrative).toBe('You take the final step.');
    });

    it('should demonstrate the step response eventTrigger selection issue', () => {
      // Test scenario: Current scene has a mix of triggers, but the one with
      // activatedTriggerIds has goToSceneId = 'end'
      const sceneWithMultipleTriggers: Scene = {
        uuid: '2',
        title: 'Final Scene',
        imageUrl: 'final.jpg',
        setting: 'Multiple possible endings',
        openingLine: 'Your choice will determine the fate of all.',
        characterIds: ['1'],
        triggers: [
          {
            type: 'action' as const,
            condition: 'player chooses path A',
            narrative: 'You chose the easy path.',
            uuid: 'path-a-trigger',
          },
          {
            type: 'fallback',
            k: 5,
            narrative: 'Time runs out.',
            goToSceneId: '3', // Goes to another scene
            uuid: 'timeout-trigger',
          },
          {
            type: 'action' as const,
            condition: 'player makes the ultimate sacrifice',
            narrative: 'You sacrifice yourself for the greater good.',
            goToSceneId: 'end', // This should be selected when activated
            endingName: 'Heroic Sacrifice',
            uuid: 'sacrifice-trigger',
          },
        ],
      };

      const currentSceneLines: DisplayLine[] = [
        { type: 'narration', text: 'Scene 2 start', metadata: { sceneId: '2' } },
        { type: 'player', text: 'I look around', characterName: 'Player' },
        {
          type: 'player',
          text: 'I sacrifice myself',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['sacrifice-trigger'] },
        },
      ];

      const triggerManager = new TriggerManager(
        sceneWithMultipleTriggers.triggers,
        currentSceneLines,
      );
      const activatedTriggers = triggerManager.getActivatedTriggers();

      // Activated triggers should contain the sacrifice trigger
      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].uuid).toBe('sacrifice-trigger');
      expect(activatedTriggers[0].goToSceneId).toBe('end');

      // Now simulate the step response logic to find eventTrigger
      const triggers = activatedTriggers;

      // This is the problematic logic from step/response.ts lines 22-33
      let eventTrigger = triggers.find((t) => t.goToSceneId !== undefined && t.type === 'action');
      if (!eventTrigger) {
        eventTrigger = triggers.find((t) => t.goToSceneId !== undefined);
      }
      if (!eventTrigger) {
        eventTrigger = triggers[0];
      }

      // This should work correctly - the eventTrigger should be the sacrifice trigger
      expect(eventTrigger).toBeDefined();
      expect(eventTrigger!.uuid).toBe('sacrifice-trigger');
      expect(eventTrigger!.goToSceneId).toBe('end');
      expect(eventTrigger!.endingName).toBe('Heroic Sacrifice');
    });

    it('should reproduce the actual bug: scene mismatch between triggers and activatedTriggerIds', () => {
      // This simulates the real issue: TriggerManager gets current scene triggers
      // but all lines from the playthrough (multiple scenes)

      // Scene 2 triggers (current scene)
      const scene2Triggers = [
        {
          type: 'action' as const,
          condition: 'player makes final choice',
          narrative: 'You make the ultimate sacrifice.',
          goToSceneId: 'end',
          endingName: 'Hero Ending',
          uuid: 'ending-trigger',
        },
      ];

      // All lines including scene transitions (what useStoryGenerator passes)
      const allLines: DisplayLine[] = [
        // Scene 1 content
        { type: 'narration', text: 'Scene 1 start', metadata: { sceneId: '1' } },
        { type: 'player', text: 'I open the door', characterName: 'Player' },
        {
          type: 'player',
          text: 'I step through',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['door-trigger'] }, // Trigger from scene 1
        },

        // Scene 2 content (current scene)
        { type: 'narration', text: 'Scene 2 start', metadata: { sceneId: '2' } },
        { type: 'player', text: 'I look around', characterName: 'Player' },
        {
          type: 'player',
          text: 'I choose to sacrifice myself',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['ending-trigger'] }, // Trigger from scene 2
        },
      ];

      // BUG: TriggerManager is created with scene2Triggers but allLines
      // This means it can't find the 'door-trigger' referenced in activatedTriggerIds
      // because that trigger belongs to scene 1, not scene 2
      const triggerManager = new TriggerManager(scene2Triggers, allLines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      // The bug: Only the ending-trigger should be found because door-trigger
      // isn't in scene2Triggers, even though it's referenced in the lines
      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].uuid).toBe('ending-trigger');
      expect(activatedTriggers[0].goToSceneId).toBe('end');

      // BUT: if the player line with ending-trigger is not the last line,
      // it might get marked as consumed and not returned at all!

      // Let's test a worse scenario where the ending trigger line is not last
      const allLinesWithExtraContent: DisplayLine[] = [
        ...allLines,
        { type: 'character', text: 'Something happens after', characterName: 'Alice' },
      ];

      const triggerManager2 = new TriggerManager(scene2Triggers, allLinesWithExtraContent);
      const activatedTriggers2 = triggerManager2.getActivatedTriggers();

      // Now the ending-trigger is consumed (not on last line) and won't be returned!
      expect(activatedTriggers2).toHaveLength(0);
    });

    it('should work correctly when given only current scene lines (demonstrates the fix)', () => {
      // This simulates the fix: TriggerManager gets current scene triggers
      // and ONLY current scene lines

      // Scene 2 triggers (current scene)
      const scene2Triggers = [
        {
          type: 'action' as const,
          condition: 'player makes final choice',
          narrative: 'You make the ultimate sacrifice.',
          goToSceneId: 'end',
          endingName: 'Hero Ending',
          uuid: 'ending-trigger',
        },
      ];

      // All lines including scene transitions
      const allLines: DisplayLine[] = [
        // Scene 1 content
        { type: 'narration', text: 'Scene 1 start', metadata: { sceneId: '1' } },
        { type: 'player', text: 'I open the door', characterName: 'Player' },
        {
          type: 'player',
          text: 'I step through',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['door-trigger'] }, // Trigger from scene 1
        },

        // Scene 2 content (current scene) - the fix filters to just these lines
        { type: 'narration', text: 'Scene 2 start', metadata: { sceneId: '2' } },
        { type: 'player', text: 'I look around', characterName: 'Player' },
        {
          type: 'player',
          text: 'I choose to sacrifice myself',
          characterName: 'Player',
          metadata: { activatedTriggerIds: ['ending-trigger'] }, // Trigger from scene 2
        },
      ];

      // Simulate getSceneLines function
      function getSceneLines(lines: DisplayLine[], sceneId: string): DisplayLine[] {
        let sceneStartIndex = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
          const lineSceneId = lines[i]?.metadata?.sceneId;
          if (lineSceneId === sceneId) {
            sceneStartIndex = i;
            break;
          }
        }
        return lines.slice(sceneStartIndex);
      }

      // FIXED: TriggerManager gets scene2Triggers and only scene2 lines
      const scene2Lines = getSceneLines(allLines, '2');
      const triggerManager = new TriggerManager(scene2Triggers, scene2Lines);
      const activatedTriggers = triggerManager.getActivatedTriggers();

      // The fix: Now ending-trigger is found and returned correctly
      expect(activatedTriggers).toHaveLength(1);
      expect(activatedTriggers[0].uuid).toBe('ending-trigger');
      expect(activatedTriggers[0].goToSceneId).toBe('end');

      // Verify that getSceneLines filtered correctly
      expect(scene2Lines).toHaveLength(3); // Only scene 2 lines
      expect(scene2Lines[0].metadata?.sceneId).toBe('2');
      expect(
        scene2Lines.every(
          (line: DisplayLine) => !line.metadata?.sceneId || line.metadata.sceneId === '2',
        ),
      ).toBe(true);

      // The ending trigger line should be the last line
      expect(scene2Lines[scene2Lines.length - 1].metadata?.activatedTriggerIds).toEqual([
        'ending-trigger',
      ]);
    });
  });
});
