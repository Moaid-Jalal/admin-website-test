"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Info, Building2 } from 'lucide-react';
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10">
      <div className='w-full text-center'>
        <p className="text-2xl font-bold">There will be something else here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Contact Card */}
        <Link href="/admin/contact" className="block">
          <Card className="hover:shadow-xl transition cursor-pointer bg-white border border-gray-200">
            <CardHeader className="flex items-center justify-center">
              <Phone className="h-10 w-10 text-primary" />
              <CardTitle className="mt-2 text-center text-2xl">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Manage contact information
            </CardContent>
          </Card>
        </Link>

        {/* About Card */}
        <Link href="/admin/about" className="block">
          <Card className="hover:shadow-xl transition cursor-pointer bg-white border border-gray-200">
            <CardHeader className="flex items-center justify-center">
              <Info className="h-10 w-10 text-primary" />
              <CardTitle className="mt-2 text-center text-2xl">About</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              Edit about us & company info
            </CardContent>
          </Card>
        </Link>

        {/* Projects Card */}
        <Link href="/admin/projects" className="block">
          <Card className="hover:shadow-xl transition cursor-pointer bg-white border border-gray-200">
            <CardHeader className="flex items-center justify-center">
              <Building2 className="h-10 w-10 text-primary" />
              <CardTitle className="mt-2 text-center text-2xl">Projects</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-muted-foreground">
              View and manage projects
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
