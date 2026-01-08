import { redirect } from 'next/navigation'

export default async function Home() {
  // TODO: Implement authentication check with backend service
  // For now, redirect to login
  redirect('/login')
}
