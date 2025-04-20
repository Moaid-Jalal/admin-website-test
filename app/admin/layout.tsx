"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Home, LayoutDashboard, FolderPlus, Users, MessageSquare, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import Navbar from '@/components/navbar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();


  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  const menuItems = [
    { icon: Home, label: 'home' },
    { icon: Users, label: 'admins' },
    { icon: MessageSquare, label: 'massages' },
    { icon: Settings, label: 'projects' },
  ];


  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}

      {/* <div className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <span className="font-bold">Admin Panel</span>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div> */}

      <Navbar />


      {/* Main Content */}
      <main className={cn(
        "bg-background flex-grow",
      )}>
        <div className="p-4 md:p-32 py-20 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}