import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  warehouseItems as initialWarehouse, 
  reserveItems as initialReserve, 
  events as initialEvents,
  recipes,
  clientInfo,
  WarehouseItem,
  ReserveItem,
  Event,
  Recipe
} from '@/data/mockData';

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
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
  clientInfo: typeof clientInfo;
  selectedRecipe: Recipe | null;
  setSelectedRecipe: (recipe: Recipe | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseItem[]>(initialWarehouse);
  const [reserve, setReserve] = useState<ReserveItem[]>(initialReserve);
  const [eventsState, setEvents] = useState<Event[]>(initialEvents);
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
        isLoggedIn,
        setIsLoggedIn,
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
        clientInfo,
        selectedRecipe,
        setSelectedRecipe,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
