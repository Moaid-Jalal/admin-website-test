"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Info, Building2 } from 'lucide-react';
import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-10 bg-[#0d0d0d] px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        
        {/* Contact Card */}
        <Link href="/admin/contact" className="block">
          <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 hover:shadow-md transition cursor-pointer">
            <CardHeader className="flex items-center justify-center">
              <Phone className="h-10 w-10 text-white" />
              <CardTitle className="mt-2 text-center text-2xl text-white">Contact</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-gray-400">
              Manage contact information
            </CardContent>
          </Card>
        </Link>

        {/* About Card */}
        <Link href="/admin/about" className="block">
          <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 hover:shadow-md transition cursor-pointer">
            <CardHeader className="flex items-center justify-center">
              <Info className="h-10 w-10 text-white" />
              <CardTitle className="mt-2 text-center text-2xl text-white">About</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-gray-400">
              Edit about us & company info
            </CardContent>
          </Card>
        </Link>

        {/* Projects Card */}
        <Link href="/admin/our-sectors/categories" className="block">
          <Card className="bg-[#1a1a1a] border border-gray-800 hover:border-gray-600 hover:shadow-md transition cursor-pointer">
            <CardHeader className="flex items-center justify-center">
              <Building2 className="h-10 w-10 text-white" />
              <CardTitle className="mt-2 text-center text-2xl text-white">Our sectors</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-sm text-gray-400">
              View and manage Our sectors
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
