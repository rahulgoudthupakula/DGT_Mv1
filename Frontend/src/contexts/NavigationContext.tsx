import { createContext, useContext, useCallback, type ReactNode } from "react";

export interface NavigationParams {
  vendorId?: string;
  vendorName?: string;
  [key: string]: string | undefined;
}

interface NavigationContextType {
  navigateTo: (nav: string, subNav: string, subPage?: string, params?: NavigationParams) => void;
  params: NavigationParams;
}

const NavigationContext = createContext<NavigationContextType>({
  navigateTo: () => {},
  params: {},
});

export const useAppNavigation = () => useContext(NavigationContext);

interface NavigationProviderProps {
  children: ReactNode;
  onNavigate: (nav: string, subNav: string, subPage?: string, params?: NavigationParams) => void;
  params: NavigationParams;
}

export const NavigationProvider = ({ children, onNavigate, params }: NavigationProviderProps) => {
  const navigateTo = useCallback(
    (nav: string, subNav: string, subPage?: string, navParams?: NavigationParams) => {
      onNavigate(nav, subNav, subPage, navParams);
    },
    [onNavigate]
  );

  return (
    <NavigationContext.Provider value={{ navigateTo, params }}>
      {children}
    </NavigationContext.Provider>
  );
};
