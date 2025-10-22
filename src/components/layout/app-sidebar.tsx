'use client';

import {
  Bot,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Salad,
  User,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '../icons/logo';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '../ui/sidebar';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/live-workout',
    label: 'Workout',
    icon: Video,
  },
  {
    href: '/my-routine',
    label: 'My Routine',
    icon: ClipboardList,
  },
  {
    href: '/my-diet',
    label: 'My Diet',
    icon: Salad,
  },
  {
    href: '/ai-coach',
    label: 'AI Coach',
    icon: Bot,
  },
  {
    href: '/schedule',
    label: 'Schedule',
    icon: CalendarDays,
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: User,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  // A simple way to handle the active state for nested routes
  const isWorkoutActive = pathname.startsWith('/live-workout') || pathname.startsWith('/workout');

  return (
    <Sidebar variant="inset" collapsible={isMobile ? 'offcanvas' : 'icon'}>
      <SidebarHeader className="flex items-center justify-between p-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="h-7 w-auto text-primary" />
        </Link>
        <SidebarTrigger className="h-7 w-7 md:hidden" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = item.href.startsWith('/live-workout') ? isWorkoutActive : pathname === item.href;
            const href = item.href.startsWith('/live-workout') ? '/live-workout' : item.href;
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={{ children: item.label, className: 'bg-primary text-primary-foreground' }}
                >
                  <Link href={href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
