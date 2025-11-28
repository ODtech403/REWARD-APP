import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to login page - middleware will handle redirecting 
  // authenticated users to their appropriate dashboard
  redirect('/login')
}
