import { Cartridge, Project, Scene } from '@/app/types';
import { useCallback, useEffect, useRef } from 'react';

export type LogResult = {
  message: string;
  context: string;
};

type PendingLog = LogResult & {
  timestamp: number;
  projectId: number;
};

// Configuration for batched logging
const COALESCE_WINDOW_MS = 60 * 1000; // 1 minute
const FLUSH_INTERVAL_MS = 30 * 1000; // Flush every 30 seconds

export function useBatchedLogger(originalLog: (projectId: number, logResult: LogResult) => void) {
  const pendingLogsRef = useRef<PendingLog[]>([]);
  const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Generate sessionId similar to useTraceLogger
  const getSessionId = useCallback(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return sessionIdRef.current;
  }, []);

  const flushLogs = useCallback(() => {
    const logs = pendingLogsRef.current;

    if (logs.length === 0) return;

    // Group logs by message and coalesce within time window
    const coalescedLogs = new Map<string, PendingLog>();

    for (const log of logs) {
      const key = `${log.projectId}-${log.message}`;
      const existing = coalescedLogs.get(key);

      if (existing && log.timestamp - existing.timestamp <= COALESCE_WINDOW_MS) {
        // Update with latest context and timestamp
        coalescedLogs.set(key, {
          ...log,
          timestamp: log.timestamp, // Use latest timestamp
        });
      } else {
        // New log or outside time window
        coalescedLogs.set(key, log);
      }
    }

    // Send coalesced logs
    for (const log of coalescedLogs.values()) {
      originalLog(log.projectId, {
        message: log.message,
        context: log.context,
      });
    }

    // Clear processed logs
    pendingLogsRef.current = [];
  }, [originalLog]);

  // Flush logs immediately using sendBeacon for page unload
  const flushLogsOnUnload = useCallback(() => {
    const logs = pendingLogsRef.current;
    if (logs.length === 0) return;

    // Group logs by message and coalesce within time window
    const coalescedLogs = new Map<string, PendingLog>();

    for (const log of logs) {
      const key = `${log.projectId}-${log.message}`;
      const existing = coalescedLogs.get(key);

      if (existing && log.timestamp - existing.timestamp <= COALESCE_WINDOW_MS) {
        coalescedLogs.set(key, {
          ...log,
          timestamp: log.timestamp,
        });
      } else {
        coalescedLogs.set(key, log);
      }
    }

    // Send logs using sendBeacon for reliable delivery during page unload
    for (const log of coalescedLogs.values()) {
      try {
        const data = JSON.stringify({
          projectId: log.projectId,
          action: log.message, // API expects 'action', not 'message'
          context: log.context,
          sessionId: getSessionId(), // API expects sessionId
        });

        // Use sendBeacon if available, otherwise fall back to regular log
        if (navigator.sendBeacon) {
          // sendBeacon with proper content type header
          const blob = new Blob([data], { type: 'application/json' });
          navigator.sendBeacon('/api/data/trace-logs', blob);
        } else {
          originalLog(log.projectId, {
            message: log.message,
            context: log.context,
          });
        }
      } catch (error) {
        console.warn('Failed to send log on unload:', error);
      }
    }

    pendingLogsRef.current = [];
  }, [originalLog, getSessionId]);

  const scheduleFlush = useCallback(() => {
    if (flushTimeoutRef.current) {
      clearTimeout(flushTimeoutRef.current);
    }
    flushTimeoutRef.current = setTimeout(flushLogs, FLUSH_INTERVAL_MS);
  }, [flushLogs]);

  const batchedLog = useCallback(
    (projectId: number, logResult: LogResult) => {
      const now = Date.now();

      // Add to pending logs
      pendingLogsRef.current.push({
        ...logResult,
        projectId,
        timestamp: now,
      });

      // Schedule flush if not already scheduled
      scheduleFlush();
    },
    [scheduleFlush],
  );

  // Set up page unload handlers and cleanup
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushLogsOnUnload();
    };

    const handlePageHide = () => {
      flushLogsOnUnload();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushLogsOnUnload();
      }
    };

    // Add event listeners for various unload scenarios
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Clean up event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear timeout and flush remaining logs
      if (flushTimeoutRef.current) {
        clearTimeout(flushTimeoutRef.current);
      }
      flushLogs();
    };
  }, [flushLogs, flushLogsOnUnload]);

  return batchedLog;
}

export const getProjectUpdateLog = (
  updates: Partial<Project>,
  oldState: Project,
): LogResult | null => {
  console.log({
    updates,
    oldState,
  });
  const changedFields = Object.keys(updates);

  if (changedFields.includes('title')) {
    return {
      message: 'updated title',
      context: updates.title || '',
    };
  }

  if (changedFields.includes('settings')) {
    return {
      message: 'updated settings',
      context: JSON.stringify(updates.settings),
    };
  }

  if (changedFields.includes('cartridge')) {
    const cartridgeLog = getCartridgeUpdateLog(updates.cartridge || {}, oldState.cartridge);
    if (cartridgeLog) {
      return cartridgeLog;
    }
  }

  // No recognized changes
  return null;
};

const getCartridgeUpdateLog = (
  updates: Partial<Cartridge>,
  oldState: Cartridge,
): LogResult | null => {
  const changedFields = Object.keys(updates);

  if (changedFields.includes('style')) {
    return {
      message: 'updated style',
      context: JSON.stringify(updates.style),
    };
  }

  if (changedFields.includes('characters')) {
    const characters = updates.characters || [];

    // Add
    if (characters.length > oldState.characters.length) {
      return {
        message: 'added character',
        context: JSON.stringify(characters[characters.length - 1]),
      };
    }

    // Remove
    if (characters.length < oldState.characters.length) {
      const removedCharacter = oldState.characters[characters.length];
      return {
        message: 'removed character',
        context: JSON.stringify(removedCharacter),
      };
    }

    // Update
    const updatedCharacter = characters.find(
      (c) =>
        JSON.stringify(c) !== JSON.stringify(oldState.characters.find((c) => c.name === c.name)),
    );
    return {
      message: 'updated character',
      context: JSON.stringify(updatedCharacter),
    };
  }

  if (changedFields.includes('scenes')) {
    const scenes = updates.scenes || [];

    // Add
    if (scenes.length > oldState.scenes.length) {
      return {
        message: 'added scene',
        context: JSON.stringify(scenes[scenes.length - 1]),
      };
    }

    // Remove
    if (scenes.length < oldState.scenes.length) {
      const removedScene = oldState.scenes[scenes.length];
      return {
        message: 'removed scene',
        context: JSON.stringify(removedScene),
      };
    }

    console.log(scenes, oldState.scenes);

    // Update - find first pair of scenes that differ
    const diffIndex = scenes.findIndex((newScene, index) => {
      const oldScene = oldState.scenes[index];
      return JSON.stringify(oldScene) !== JSON.stringify(newScene);
    });

    if (diffIndex === -1) {
      console.log('no updated scene');
      return null;
    }

    const oldScene = oldState.scenes[diffIndex];
    const updatedScene = scenes[diffIndex];

    // Basic fields edit
    const sceneKeys: (keyof Scene)[] = [
      'title',
      'script',
      'characterIds',
      'placeId',
      'triggers',
      'prompt',
    ];
    for (const field of sceneKeys) {
      if (JSON.stringify(updatedScene[field]) !== JSON.stringify(oldScene![field])) {
        return {
          message: `updated scene ${field}`,
          context: JSON.stringify(updatedScene[field]),
        };
      }
    }

    // Triggers edit
    const triggers = updatedScene.triggers || [];
    const oldTriggers = oldScene!.triggers || [];

    if (triggers.length > oldTriggers.length) {
      return {
        message: 'added trigger',
        context: JSON.stringify(triggers[triggers.length - 1]),
      };
    }

    if (triggers.length < oldTriggers.length) {
      const removedTrigger = oldTriggers[triggers.length];
      return {
        message: 'removed trigger',
        context: JSON.stringify(removedTrigger),
      };
    }

    // Update
    const updatedTrigger = triggers.find((t, index) => {
      return JSON.stringify(t) !== JSON.stringify(oldTriggers[index]);
    });

    if (!updatedTrigger) {
      return null;
    }

    return {
      message: 'updated trigger',
      context: JSON.stringify(updatedTrigger),
    };
  }

  return null;
};
