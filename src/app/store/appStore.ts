import { create } from "zustand";

interface AppState {
  activeTab: string;
  n8nStatus: "online" | "offline" | "checking";
  notifications: Array<{
    id: string;
    type: "success" | "error" | "info";
    message: string;
  }>;
  setActiveTab: (tab: string) => void;
  setN8nStatus: (status: "online" | "offline" | "checking") => void;
  addNotification: (notification: Omit<AppState["notifications"][0], "id">) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: "home",
  n8nStatus: "checking",
  notifications: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setN8nStatus: (status) => set({ n8nStatus: status }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: Date.now().toString() },
      ],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
