import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

const PUBLIC_ROUTES = ['/login', '/register', '/auth/callback']
const ADVERTISER_ROUTES = ['/advertiser', '/advertiser-dashboard', '/advertiser-wallet']
const USER_ROUTES = ['/dashboard', '/task', '/wallet']
const USER_DASHBOARD = '/dashboard'
const ADVERTISER_DASHBOARD = '/advertiser-dashboard'

function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

function hasAdvertiserAccess(role: string): boolean {
  return role === 'advertiser' || role === 'admin'
}

export async function updateSession(request: NextRequest) {
  // Default response - allow request to continue
  let response = NextResponse.next({ request })

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // If env vars are missing, allow request to continue
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return response
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname
    const isPublicRoute = matchesRoutes(pathname, PUBLIC_ROUTES)
    const isAdvertiserRoute = matchesRoutes(pathname, ADVERTISER_ROUTES)
    const isUserRoute = matchesRoutes(pathname, USER_ROUTES)

    // Unauthenticated users
    if (!user) {
      if (!isPublicRoute && pathname !== '/') {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
      }
      return response
    }

    // Get role from metadata or fetch from profile
    let role = user.user_metadata?.role as string | undefined

    if (!role && (isAdvertiserRoute || isUserRoute || pathname === '/')) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      role = (profileData as { role: string } | null)?.role
    }

    role = role || 'user'
    const isAdvertiserOrAdmin = hasAdvertiserAccess(role)

    // Redirect authenticated users from auth pages
    if (isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
      return NextResponse.redirect(url)
    }

    // Protect advertiser routes
    if (isAdvertiserRoute && !isAdvertiserOrAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = USER_DASHBOARD
      return NextResponse.redirect(url)
    }

    // Redirect advertisers from user routes
    if (isUserRoute && isAdvertiserOrAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = ADVERTISER_DASHBOARD
      return NextResponse.redirect(url)
    }

    // Redirect root to dashboard
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow request to continue
    return response
  }
}

export function checkRouteAuthorization(
  role: string | null,
  pathname: string
): { authorized: boolean; redirectTo: string | null } {
  const isPublicRoute = matchesRoutes(pathname, PUBLIC_ROUTES)
  const isAdvertiserRoute = matchesRoutes(pathname, ADVERTISER_ROUTES)
  const isUserRoute = matchesRoutes(pathname, USER_ROUTES)
  const isAuthenticated = role !== null
  const isAdvertiserOrAdmin = role ? hasAdvertiserAccess(role) : false

  if (!isAuthenticated) {
    if (isPublicRoute || pathname === '/') {
      return { authorized: true, redirectTo: null }
    }
    return { authorized: false, redirectTo: '/login' }
  }

  if (isPublicRoute) {
    return {
      authorized: false,
      redirectTo: isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    }
  }

  if (isAdvertiserRoute && !isAdvertiserOrAdmin) {
    return { authorized: false, redirectTo: USER_DASHBOARD }
  }

  if (isUserRoute && isAdvertiserOrAdmin) {
    return { authorized: false, redirectTo: ADVERTISER_DASHBOARD }
  }

  if (pathname === '/') {
    return {
      authorized: false,
      redirectTo: isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    }
  }

  return { authorized: true, redirectTo: null }
}
