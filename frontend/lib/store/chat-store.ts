import { create } from "zustand";

interface ChatState {
  pendingMessage: string | null;
  setPendingMessage: (message: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  pendingMessage: null,
  setPendingMessage: (message: string | null) => set({ pendingMessage: message }),
}));
