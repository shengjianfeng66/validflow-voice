import { create } from 'zustand';

interface InterviewStore {
  intervieweeId: string | null;
  responseId: string | null;
  setInterviewIds: (intervieweeId: string, responseId: string) => void;
  clearInterviewIds: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  intervieweeId: null,
  responseId: null,
  setInterviewIds: (intervieweeId: string, responseId: string) =>
    set({ intervieweeId, responseId }),
  clearInterviewIds: () => set({ intervieweeId: null, responseId: null }),
}));
