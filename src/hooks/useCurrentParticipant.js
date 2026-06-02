import { useCallback, useState } from 'react';
import { getCurrentParticipant, saveCurrentParticipant } from '../utils/storage.js';

export function useCurrentParticipant() {
  const [participant, setParticipant] = useState(() => getCurrentParticipant());

  const refreshParticipant = useCallback(() => {
    setParticipant(getCurrentParticipant());
  }, []);

  const updateParticipant = useCallback((updater) => {
    setParticipant((current) => {
      const latest = getCurrentParticipant();
      const next = typeof updater === 'function' ? updater(latest) : updater;

      if (!next) return current;
      saveCurrentParticipant(next);
      return next;
    });
  }, []);

  return {
    participant,
    refreshParticipant,
    updateParticipant,
  };
}
