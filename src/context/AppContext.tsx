// AppContext v2 - Kitchen Flow State Management
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  warehouseItems as casseroleWarehouse, 
  reserveItems as casseroleReserve, 
  events as casseroleEvents,
  recipes as casseroleRecipes,
  clientInfo as casseroleClientInfo,
  WarehouseItem,
  ReserveItem,
  Event,
  Recipe,
  ClientInfo
} from '@/data/mockData';
import {
  pizzakingWarehouse,
  pizzakingReserve,
  pizzakingEvents,
  pizzakingRecipes,
  pizzakingClientInfo
} from '@/data/pizzakingData';

export type ClientType = 'casserole' | 'pizzaking';

interface AppContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentClient: ClientType;
  loginAs: (client: ClientType) => void;
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
  const [currentClient, setCurrentClient] = useState<ClientType>('casserole');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warehouse, setWarehouse] = useState<WarehouseItem[]>(casseroleWarehouse);
  const [reserve, setReserve] = useState<ReserveItem[]>(casseroleReserve);
  const [eventsState, setEvents] = useState<Event[]>(casseroleEvents);
  const [recipes, setRecipes] = useState<Recipe[]>(casseroleRecipes);
  const [clientInfo, setClientInfo] = useState<ClientInfo>(casseroleClientInfo);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const loginAs = (client: ClientType) => {
    setCurrentClient(client);
    
    if (client === 'casserole') {
      setWarehouse(casseroleWarehouse);
      setReserve(casseroleReserve);
      setEvents(casseroleEvents);
      setRecipes(casseroleRecipes);
      setClientInfo(casseroleClientInfo);
    } else {
      setWarehouse(pizzakingWarehouse);
      setReserve(pizzakingReserve);
      setEvents(pizzakingEvents);
      setRecipes(pizzakingRecipes);
      setClientInfo(pizzakingClientInfo);
    }
    
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
        currentClient,
        loginAs,
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
