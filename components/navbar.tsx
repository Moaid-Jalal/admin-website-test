"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Building2, Home, Phone, Users2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"



const Navbar = () => {
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    return pathname === path
  }

  const NavItems = () => (
    <>
      <SheetClose asChild>
        <Link href="/admin" className="w-full">
          <Button 
            variant={isActive('/admin') ? 'default' : 'ghost'} 
            className="w-full justify-start"
            size="sm"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link href="/admin/projects" className="w-full">
          <Button 
            variant={isActive('/projects') ? 'default' : 'ghost'} 
            className="w-full justify-start"
            size="sm"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Projects
          </Button>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link href="/admin/about" className="w-full">
          <Button 
            variant={isActive('/about') ? 'default' : 'ghost'} 
            className="w-full justify-start"
            size="sm"
          >
            <Users2 className="mr-2 h-4 w-4" />
            About
          </Button>
        </Link>
      </SheetClose>
      <SheetClose asChild>
        <Link href="/admin/contact" className="w-full">
          <Button 
            variant={isActive('/contact') ? 'default' : 'ghost'} 
            className="w-full justify-start"
            size="sm"
          >
            <Phone className="mr-2 h-4 w-4" />
            Contact
          </Button>
        </Link>
      </SheetClose>
    </>
  )

  const DesktopNavItems = () => (
    <>
      <Link href="/admin">
        <Button variant={isActive('/') ? 'default' : 'ghost'}>
          <Home className="mr-2 h-4 w-4" />
          home
        </Button>
      </Link>
      <Link href="/admin/projects">
        <Button variant={isActive('/projects') ? 'default' : 'ghost'}>
          <Building2 className="mr-2 h-4 w-4" />
          Projects
        </Button>
      </Link>
      <Link href="/admin/about">
        <Button variant={isActive('/about') ? 'default' : 'ghost'}>
          <Users2 className="mr-2 h-4 w-4" />
          About
        </Button>
      </Link>
      <Link href="/admin/contact">
        <Button variant={isActive('/contact') ? 'default' : 'ghost'}>
          <Phone className="mr-2 h-4 w-4" />
          Contact
        </Button>
      </Link>
    </>
  )

  return (
    <nav className="border-b fixed w-full bg-background z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="ml-2 text-lg font-bold">Your Company</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <DesktopNavItems />
          </div>

          {/* Mobile Navigation */}
          <div className="flex items-center md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] p-0">
                <nav className="flex flex-col gap-1 p-4">
                  <NavItems />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar