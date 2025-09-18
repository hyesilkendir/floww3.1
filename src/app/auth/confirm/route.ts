import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Get base URL from environment variables
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Ensure redirect URL is absolute for production
      const redirectUrl = next.startsWith('/') ? `${baseUrl}${next}` : next
      
      // For security, validate redirect URL is from same domain
      try {
        const redirectUrlObj = new URL(redirectUrl)
        const baseUrlObj = new URL(baseUrl)
        
        if (redirectUrlObj.origin === baseUrlObj.origin) {
          redirect(next) // Use relative redirect for same origin
        } else {
          redirect('/dashboard') // Fallback to dashboard for external URLs
        }
      } catch {
        redirect('/dashboard') // Fallback if URL parsing fails
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect('/error')
}
