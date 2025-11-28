import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database'

/**
 * Route protection configuration
 * 
 * PUBLIC_ROUTES: Routes accessible without authentication
 * ADVERTISER_ROUTES: Routes that require advertiser or admin role
 * USER_ROUTES: Routes intended for regular users (task completers)
 */
const PUBLIC_ROUTES = ['/login', '/register', '/auth/callback']
const ADVERTISER_ROUTES = ['/advertiser', '/advertiser-dashboard', '/advertiser-wallet']
const USER_ROUTES = ['/dashboard', '/task', '/wallet']
const USER_DASHBOARD = '/dashboard'
const ADVERTISER_DASHBOARD = '/advertiser-dashboard'

/**
 * Check if a pathname matches any of the given route prefixes
 */
function matchesRoutes(pathname: string, routes: string[]): boolean {
  return routes.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

/**
 * Determine the user's role from profile data
 * Returns 'user' as default if profile doesn't exist
 */
function getUserRole(profile: { role: string } | null): string {
  return profile?.role || 'user'
}

/**
 * Check if a role has advertiser-level access
 */
function hasAdvertiserAccess(role: string): boolean {
  return role === 'advertiser' || role === 'admin'
}

/**
 * Middleware to handle session validation and role-based route protection
 * 
 * Requirements covered:
 * - 1.4: Persist authentication state across page refreshes (session refresh)
 * - 7.2: Redirect advertisers to advertiser dashboard on login
 * - 7.4: Restrict access to advertiser-only routes based on role
 * 
 * Route Protection Logic:
 * 1. Unauthenticated users → redirect to /login (except public routes)
 * 2. Authenticated users on auth pages → redirect to appropriate dashboard
 * 3. Users on advertiser routes → redirect to user dashboard
 * 4. Advertisers on root → redirect to advertiser dashboard
 * 5. Users on root → redirect to user dashboard
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Validate session - this refreshes the session if needed
  // This ensures authentication state persists across page refreshes (Req 1.4)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = matchesRoutes(pathname, PUBLIC_ROUTES)
  const isAdvertiserRoute = matchesRoutes(pathname, ADVERTISER_ROUTES)
  const isUserRoute = matchesRoutes(pathname, USER_ROUTES)

  // Unauthenticated users: redirect to login for protected routes
  if (!user) {
    if (!isPublicRoute && pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Try to get role from user metadata first (faster, no DB call)
  // Fall back to profile fetch only if needed for role-specific routes
  let role = user.user_metadata?.role as string | undefined
  
  // Only fetch profile if we need role info and don't have it in metadata
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

  // Redirect authenticated users away from auth pages to their dashboard
  // Advertisers go to advertiser dashboard (Req 7.2)
  if (isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    return NextResponse.redirect(url)
  }

  // Role-based route protection: advertiser routes require advertiser/admin role (Req 7.4)
  if (isAdvertiserRoute && !isAdvertiserOrAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = USER_DASHBOARD
    return NextResponse.redirect(url)
  }

  // Redirect advertisers accessing user-specific routes to advertiser dashboard
  // This ensures advertisers use the correct portal for their role
  if (isUserRoute && isAdvertiserOrAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = ADVERTISER_DASHBOARD
    return NextResponse.redirect(url)
  }

  // Redirect root to appropriate dashboard based on role
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

/**
 * Utility function to check route authorization
 * Exported for use in property-based tests
 * 
 * @param role - User's role ('user', 'advertiser', 'admin')
 * @param pathname - The route being accessed
 * @returns Object with authorization result and redirect target if applicable
 */
export function checkRouteAuthorization(
  role: string | null,
  pathname: string
): { authorized: boolean; redirectTo: string | null } {
  const isPublicRoute = matchesRoutes(pathname, PUBLIC_ROUTES)
  const isAdvertiserRoute = matchesRoutes(pathname, ADVERTISER_ROUTES)
  const isUserRoute = matchesRoutes(pathname, USER_ROUTES)
  const isAuthenticated = role !== null
  const isAdvertiserOrAdmin = role ? hasAdvertiserAccess(role) : false

  // Unauthenticated users can only access public routes and root
  if (!isAuthenticated) {
    if (isPublicRoute || pathname === '/') {
      return { authorized: true, redirectTo: null }
    }
    return { authorized: false, redirectTo: '/login' }
  }

  // Authenticated users on public routes get redirected to dashboard
  if (isPublicRoute) {
    return {
      authorized: false,
      redirectTo: isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    }
  }

  // Advertiser routes require advertiser/admin role
  if (isAdvertiserRoute && !isAdvertiserOrAdmin) {
    return { authorized: false, redirectTo: USER_DASHBOARD }
  }

  // User routes redirect advertisers to their dashboard
  if (isUserRoute && isAdvertiserOrAdmin) {
    return { authorized: false, redirectTo: ADVERTISER_DASHBOARD }
  }

  // Root redirects to appropriate dashboard
  if (pathname === '/') {
    return {
      authorized: false,
      redirectTo: isAdvertiserOrAdmin ? ADVERTISER_DASHBOARD : USER_DASHBOARD
    }
  }

  return { authorized: true, redirectTo: null }
}
