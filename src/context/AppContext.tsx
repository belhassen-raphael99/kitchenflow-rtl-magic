// @refresh reset
// AppContext v3 - Kitchen Flow State Management (Simplified)
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  warehouseItems, 
  reserveItems, 
  events as initialEvents,
  recipes as initialRecipes,
  clientInfo as defaultClientInfo,
  WarehouseItem,
  ReserveItem,
  Event,
  Recipe,
  ClientInfo
} from '@/data/mockData';

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  login: () => void;
  logout: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  warehouse: WarehouseItem[];
  setWarehouse: React.Dispatch<React.SetStateAction<WarehouseItem[]>>;
  reserve: ReserveItem[];
  setReserve: React.Dispatch<React.SetStateAction<ReserveItem[]>>;
  events: Event[];
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  recipes: Recipe[];
  clientInfo: ClientInfo;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseItem[]>(warehouseItems);
  const [reserve, setReserve] = useState<ReserveItem[]>(reserveItems);
  const [eventsState, setEvents] = useState<Event[]>(initialEvents);
  const [recipes, setRecipes] = useState<Recipe[]>(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const login = () => {
    setCurrentPage('dashboard');
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

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
        isLoggedIn,
        setIsLoggedIn,
        login,
        logout,
        currentPage,
        setCurrentPage,
        sidebarOpen,
        setSidebarOpen,
        isFullscreen,
        toggleFullscreen,
        warehouse,
        setWarehouse,
        reserve,
        setReserve,
        events: eventsState,
        setEvents,
        recipes,
        clientInfo: defaultClientInfo,
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
