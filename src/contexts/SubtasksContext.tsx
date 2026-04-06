import { createContext, useContext, ReactNode } from 'react';
import { useSubtasks as useSubtasksHook } from '@/hooks/useSubtasks';

type SubtasksContextType = ReturnType<typeof useSubtasksHook>;

const SubtasksContext = createContext<SubtasksContextType | null>(null);

export function SubtasksProvider({ children }: { children: ReactNode }) {
  const subtasks = useSubtasksHook();
  return (
    <SubtasksContext.Provider value={subtasks}>
      {children}
    </SubtasksContext.Provider>
  );
}

export function useSubtasksContext(): SubtasksContextType {
  const ctx = useContext(SubtasksContext);
  if (!ctx) throw new Error('useSubtasksContext must be used within SubtasksProvider');
  return ctx;
}
