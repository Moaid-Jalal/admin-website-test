"use client"

import { aboutUsService } from '@/app/service/aboutUsService'
import Link from 'next/link'

const Footer = () => {
  const { data } = aboutUsService.getAboutUsInformation()

  return (
    <footer className="bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <p>{data.contact_info.Address}</p>
            <p>Phone: {data.contact_info.phone}</p>
            <p>Email: {data.contact_info.email}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/projects" className="hover:underline">Projects</Link></li>
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/contact" className="hover:underline">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <Link href="https://facebook.com" className="hover:text-primary">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="https://instagram.com" className="hover:text-primary">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="https://linkedin.com" className="hover:text-primary">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center">
          <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer