"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Building2, Home, Phone, Users2, Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { loginService } from '@/app/service/login'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import  logo from '@/images/logo.jpg'


const Navbar = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()

  const isActive = (path: string) => {
    return pathname === path
  }

  const logout = async () => {
    try {
      await loginService.logout()

      router.push('/login')
      toast({
        title: "Success",
        description: "Logged out successfully",
        variant: "default",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      })
    }
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
        <Link href="/admin/our-sectors/categories" className="w-full">
          <Button 
            variant={isActive('/our-sectors') ? 'default' : 'ghost'} 
            className="w-full justify-start"
            size="sm"
          >
            <Building2 className="mr-2 h-4 w-4" />
            sectors
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
      <SheetClose asChild>
        <div className="w-full">
          <Button
            onClick={logout}
            variant={'destructive'} 
            className="w-full justify-start"
            size="sm"
          >
            <LogOut className="mr-2 h-4 w-4" />
            logout
          </Button>
        </div>
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
      <Link href="/admin/our-sectors/categories">
        <Button variant={isActive('/our-sectors') ? 'default' : 'ghost'}>
          <Building2 className="mr-2 h-4 w-4" />
          sectors
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
      <div>
        <Button
          onClick={logout}
          variant={'destructive'} 
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          logout
        </Button>
      </div>
    </>
  )

  return (
    <nav className="border-b fixed w-full bg-black z-50">
      <div className="max-w-7xl mx-auto px-1 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center overflow-hidden">
            <Link href="/" className="flex items-center">
              <Image
                src={logo}
                width={200}
                height={200}
                className='bg-inherit'
                alt='website logo'
              />
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