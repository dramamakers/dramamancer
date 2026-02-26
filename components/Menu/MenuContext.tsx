import { DropdownMenuButtonOption } from '@/components/Dropdown';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Menu } from '.';

interface MenuContextType {
  showMenu: (e: React.MouseEvent, options: DropdownMenuButtonOption[]) => void;
  hideMenu: () => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  position: { x: number; y: number };
  options: DropdownMenuButtonOption[];
}

const MenuContext = createContext<MenuContextType | null>(null);

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [options, setOptions] = useState<DropdownMenuButtonOption[]>([]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const showMenu = (e: React.MouseEvent, menuOptions: DropdownMenuButtonOption[]) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setOptions(menuOptions);
    setIsVisible(true);
  };

  const hideMenu = () => {
    setIsVisible(false);
  };

  return (
    <MenuContext.Provider
      value={{
        showMenu,
        hideMenu,
        menuRef,
        isVisible,
        position,
        options,
      }}
    >
      {children}
      {isVisible && <Menu />}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
