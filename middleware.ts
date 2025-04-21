import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // أولاً التحقق من الوصول إلى الصفحات المحمية
  if (pathname.startsWith('/admin') && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // إذا كان التوكن موجودًا وأنت في صفحة login أو الصفحة الرئيسية، يتم تحويلك إلى /admin
  if ((pathname === '/login' || pathname === '/') && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*'],
};
