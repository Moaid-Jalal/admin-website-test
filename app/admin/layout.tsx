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
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
        try {
            await loginService.checkAuth();
        } catch (err) {
            console.error('Redirecting to login due to authentication failure:', err);
            router.push('/login'); 
        }
    };

    checkAuth();  
}, [router]); 

  return (
    <div className="min-h-screen flex flex-col">

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