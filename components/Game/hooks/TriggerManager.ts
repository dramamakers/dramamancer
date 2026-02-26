/* Should be able to reconstruct TriggerManager upon every new line and get the same result */
import { ActionTrigger, DisplayLine, Trigger } from '@/app/types';
import { getTriggerId } from '@/utils/uuid';

export type TriggerState = {
  trigger: Trigger;
  consumed: boolean; // whether the trigger has been used
  turnsLeft?: number; // for fallback triggers, how many turns are left
  depsSatisfied: boolean; // whether the trigger's dependencies have been satisfied
};

export class TriggerManager {
  private triggerStates: Record<string /* uuid */, TriggerState> = {};
  private pendingTriggerIds: string[] = [];

  constructor(triggers: Trigger[], lines: DisplayLine[]) {
    const numberOfPlayerLines = lines.filter((line) => line.type === 'player').length;

    // Given the lines in the scene so far,
    // determine the trigger states as if we were on the last line
    this.triggerStates = {};
    triggers.map((trigger: Trigger, index: number) => {
      const turnsLeft = trigger.type === 'fallback' ? trigger.k - numberOfPlayerLines : undefined;
      const uuid = getTriggerId(trigger, index);
      this.triggerStates[uuid] = {
        trigger,
        consumed: false,
        turnsLeft,
        depsSatisfied: false,
      };
    });

    // Iterate through lines before the last line
    // If any had activatedTriggerIds, consider them consumed
    for (const line of lines.slice(0, -1)) {
      const activatedTriggerIds = line.metadata?.activatedTriggerIds;
      if (activatedTriggerIds !== undefined && activatedTriggerIds.length > 0) {
        activatedTriggerIds.forEach((uuid) => {
          const state = this.triggerStates[uuid];
          if (state) {
            state.consumed = true;
            state.depsSatisfied = true;
          }
        });
      }
    }

    // Update dependenciesSatisfied for all triggers based on current state
    this.updateDependenciesSatisfied();

    // Now add fallback triggers to pending if they should activate and haven't been consumed
    triggers.map((trigger, index) => {
      const uuid = getTriggerId(trigger, index);
      const state = this.triggerStates[uuid];
      if (
        trigger.type === 'fallback' &&
        state.turnsLeft !== undefined &&
        state.turnsLeft <= 0 &&
        !state.consumed
      ) {
        this.pendingTriggerIds.push(uuid);
      }
    });

    // Check if the last line has any activatedTriggerIds
    // If so, assume them as pending and prioritize them before fallbacks
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      const activatedTriggerIds = lastLine.metadata?.activatedTriggerIds;
      if (activatedTriggerIds !== undefined && activatedTriggerIds.length > 0) {
        const validIds = activatedTriggerIds.filter((id) => this.triggerStates[id] !== undefined);
        this.pendingTriggerIds = [...validIds, ...this.pendingTriggerIds];
      }
    }
  }

  // Pull from pending triggers, then activate them
  // Used to generate the next line with /step
  // Consumes triggers
  getActivatedTriggers(): Trigger[] {
    const triggers = this.pendingTriggerIds.map((uuid) => {
      const state = Object.values(this.triggerStates).find((state) => state.trigger.uuid === uuid);
      if (!state) {
        throw new Error(`No trigger or state found for triggerUuid: ${uuid}`);
      }
      state.consumed = true;
      return state.trigger;
    });
    // Clear pending after consumption
    this.pendingTriggerIds = [];
    // Recompute deps satisfaction after state changes
    this.updateDependenciesSatisfied();
    return triggers;
  }

  getAllTriggerStates(): Record<string /* id */, TriggerState> {
    return this.triggerStates;
  }

  possibleTriggers(): Record<string /* id */, ActionTrigger> {
    const actionTriggers = Object.entries(this.triggerStates).reduce(
      (acc, [uuid, state]) => {
        if (state.consumed || state.trigger.type !== 'action') {
          return acc;
        }

        // Check if dependencies are satisfied
        const trigger = state.trigger as ActionTrigger;
        if (!state.depsSatisfied) {
          return acc;
        }

        return {
          ...acc,
          [uuid]: trigger,
        };
      },
      {} as Record<string, ActionTrigger>,
    );
    return actionTriggers;
  }

  // Get activated triggers with their full information
  getTriggers(triggerIds: string[]): Trigger[] {
    return triggerIds
      .map((uuid) => this.triggerStates[uuid]?.trigger)
      .filter((trigger): trigger is Trigger => trigger !== undefined);
  }

  private updateDependenciesSatisfied() {
    Object.values(this.triggerStates).forEach((state) => {
      // If trigger is already consumed, depsSatisfied should be true
      if (state.consumed) {
        state.depsSatisfied = true;
        return;
      }

      const trigger = state.trigger;

      // For action triggers, check dependencies
      if (trigger.type === 'action') {
        const actionTrigger = trigger as ActionTrigger;
        if (!actionTrigger.dependsOnTriggerIds || actionTrigger.dependsOnTriggerIds.length === 0) {
          // No dependencies means always satisfied
          state.depsSatisfied = true;
        } else {
          // dependsOnTriggerIds contains uuids; verify those are consumed
          state.depsSatisfied = actionTrigger.dependsOnTriggerIds.every((depUuid) => {
            const depState = this.triggerStates[depUuid];
            return !!depState && depState.consumed;
          });
        }
      } else {
        // For fallback triggers, dependencies are always satisfied
        state.depsSatisfied = true;
      }
    });
  }
}
