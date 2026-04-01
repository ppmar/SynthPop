import { create } from "zustand";

interface UIState {
  sidebarOpen: boolean;
  activeTab: string;
  totalCostUsd: number;

  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: string) => void;
  addTotalCost: (amount: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  activeTab: "dashboard",
  totalCostUsd: 0,

  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addTotalCost: (amount) =>
    set((s) => ({ totalCostUsd: s.totalCostUsd + amount })),
}));
