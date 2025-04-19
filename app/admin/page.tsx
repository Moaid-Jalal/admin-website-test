"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users2, MessageSquare, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { projectsService } from '../service/projectsService';
import { useToast } from '@/hooks/use-toast';
import Link from "next/link";

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalMessages: 0,
    recentProjects: []
  });

  const chartData = [
    { name: 'Jan', projects: 4 },
    { name: 'Feb', projects: 6 },
    { name: 'Mar', projects: 8 },
    { name: 'Apr', projects: 5 },
    { name: 'May', projects: 7 },
    { name: 'Jun', projects: 9 }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10">
      <div className='w-full text-center'>
        <p className="text-2xl text-bold"> there will be something else here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Link href="/admin/contact" className="block">
          <div className="rounded-2xl shadow-lg bg-black hover:bg-gray-10 transition p-10 flex flex-col items-center justify-center min-h-[200px] cursor-pointer border border-gray-200">
            <span className="text-4xl mb-4">📞</span>
            <span className="text-2xl font-bold">Contact</span>
            <span className="text-white mt-2 text-center">Manage contact information</span>
          </div>
        </Link>
        <Link href="/admin/about" className="block">
          <div className="rounded-2xl shadow-lg bg-black hover:bg-gray-10 transition p-10 flex flex-col items-center justify-center min-h-[200px] cursor-pointer border border-gray-200">
            <span className="text-4xl mb-4">ℹ️</span>
            <span className="text-2xl font-bold">About</span>
            <span className="text-white mt-2 text-center">Edit about us & company info</span>
          </div>
        </Link>
        <Link href="/admin/projects" className="block">
          <div className="rounded-2xl shadow-lg bg-black hover:bg-gray-10 transition p-10 flex flex-col items-center justify-center min-h-[200px] cursor-pointer border border-gray-200">
            <span className="text-4xl mb-4">🏗️</span>
            <span className="text-2xl font-bold">Projects</span>
            <span className="text-white mt-2 text-center">View and manage projects</span>
          </div>
        </Link>
      </div>
    </div>
  );
}