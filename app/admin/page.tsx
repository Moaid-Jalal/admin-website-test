"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users2, MessageSquare, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { projectsService } from '../service/projectsService';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { toast } = useToast()
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsers: 0,
    totalMessages: 0,
    recentProjects: []
  });

  // useEffect(() => {
  //   const fetchStats = async () => {
  //     try {
  //       const token = localStorage.getItem('adminToken');
        
  //       const response = await fetch('/api/admin/stats', {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       });
  //       const data = await response.json();
  //       setStats(data);
  //     } catch (error) {
  //       console.error('Error fetching stats:', error);
  //     }
  //   };

  //   fetchStats();
  // }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projects = await projectsService.getProject();
        // setStats((prevStats) => ({
        //   ...prevStats,
        //   totalProjects: projects.length,
        //   recentProjects: projects.slice(0, 5),
        // }));
        console.log(projects)
        toast({
          title: "Projects Fetched",
          description: `Fetched ${projects.length} projects successfully.`,
          variant: 'default',
          duration: 3000,
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, []);

  const chartData = [
    { name: 'Jan', projects: 4 },
    { name: 'Feb', projects: 6 },
    { name: 'Mar', projects: 8 },
    { name: 'Apr', projects: 5 },
    { name: 'May', projects: 7 },
    { name: 'Jun', projects: 9 }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +10.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">New Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              +12 since yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+25%</div>
            <p className="text-xs text-muted-foreground">
              Compared to last year
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="projects" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}