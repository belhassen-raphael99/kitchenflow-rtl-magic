// @refresh reset
// AppContext v4 - Simplified UI State Management Only
import { createContext, useContext, useState, ReactNode } from 'react';
import { clientInfo, ClientInfo } from '@/types';
import type { Recipe } from '@/hooks/useRecipes';

interface AppContextType {
  // UI State only
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  
  // Static configuration
  clientInfo: ClientInfo;
  
  // Temporary UI state for recipe selection
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        isFullscreen,
        toggleFullscreen,
        clientInfo,
        selectedRecipe,
        setSelectedRecipe,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
