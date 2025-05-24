import React, { createContext, useContext, useState } from 'react';

interface AppContextProps {
  isMiniApp: boolean;
  setIsMiniApp: (v: boolean) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  return (
    <AppContext.Provider value={{ isMiniApp, setIsMiniApp }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
