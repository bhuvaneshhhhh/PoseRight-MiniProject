'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from '../ui/sidebar';
import { Button } from '../ui/button';

export function MobileNav() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 md:hidden">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg"
        onClick={toggleSidebar}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Open Menu</span>
      </Button>
    </div>
  );
}
