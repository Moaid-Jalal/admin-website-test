"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Navbar from '@/components/navbar';
import { loginService } from '../service/login';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
        try {
            await loginService.checkAuth();
            setIsAdmin(true);
        } catch (err) {
            router.push('/login'); 
        }
    };

    checkAuth();  
}, [router]); 

  return (
    // Check if the user is an admin

    <div className="min-h-screen flex flex-col">
      {!isAdmin ? (
        <div></div>
      ) : (
        <>
          <Navbar />
          <main className={cn(
            "bg-background flex-grow",
          )}>
            <div className="p-4 md:p-32 py-20 flex flex-col">
              {children}
            </div>
          </main>
        </>
      )}
    </div>
  );
}