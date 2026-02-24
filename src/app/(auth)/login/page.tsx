'use client'

import { useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setIsEmailLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsEmailLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  async function handleGoogleOAuth() {
    setIsGoogleLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setIsGoogleLoading(false)
      setError(error.message)
    }
    // On success, browser is redirected — no need to reset loading state
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      {/* Subtle radial gradient background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(124 58 237 / 0.07) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <Card
        className="relative w-full max-w-sm border border-neutral-200/80 bg-white"
        style={{
          boxShadow:
            '0 4px 6px -1px rgb(124 58 237 / 0.10), 0 2px 4px -2px rgb(124 58 237 / 0.06), 0 0 0 1px rgb(124 58 237 / 0.04)',
        }}
      >
        <CardHeader className="pb-4 pt-8 px-8 text-center">
          {/* Wordmark */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 3L15 7.5V12L9 15L3 12V7.5L9 3Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 3V15M3 7.5L15 7.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeOpacity="0.5"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-neutral-900">
              Aloftly
            </span>
          </div>

          <CardTitle className="text-xl font-semibold tracking-tight text-neutral-900">
            {magicLinkSent ? 'Check your email' : 'Welcome back'}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-neutral-500 mt-1">
            {magicLinkSent
              ? `We sent a sign-in link to ${email}`
              : 'Sign in to your analytics dashboard'}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          {magicLinkSent ? (
            <div className="space-y-4">
              <div
                className="rounded-lg p-4 text-sm leading-relaxed text-neutral-600"
                style={{ background: 'rgb(124 58 237 / 0.05)', border: '1px solid rgb(124 58 237 / 0.15)' }}
              >
                Click the link in your email to sign in. The link expires in 1 hour.
              </div>
              <Button
                variant="ghost"
                className="w-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
                onClick={() => {
                  setMagicLinkSent(false)
                  setEmail('')
                  setError(null)
                }}
              >
                Use a different email
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div
                  className="rounded-lg p-3 text-sm text-red-700"
                  style={{ background: 'rgb(239 68 68 / 0.08)', border: '1px solid rgb(239 68 68 / 0.2)' }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isEmailLoading}
                  className="h-10 border-neutral-200 bg-white placeholder:text-neutral-400 focus-visible:ring-primary-600/30 focus-visible:border-primary-600 transition-colors"
                  aria-label="Email address"
                />
                <Button
                  type="submit"
                  disabled={isEmailLoading || !email.trim()}
                  className="w-full h-10 font-medium tracking-tight transition-all active:scale-[0.98]"
                  style={{
                    background: isEmailLoading
                      ? 'rgb(124 58 237 / 0.7)'
                      : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  }}
                >
                  {isEmailLoading ? 'Sending link...' : 'Send magic link'}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400 font-medium">or</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>

              {/* Google OAuth button */}
              <Button
                type="button"
                variant="outline"
                disabled={isGoogleLoading}
                onClick={handleGoogleOAuth}
                className="w-full h-10 border-neutral-200 bg-white text-neutral-700 font-medium tracking-tight hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 active:scale-[0.98] transition-all focus-visible:ring-primary-600/30"
              >
                {isGoogleLoading ? (
                  <span className="text-neutral-500">Connecting...</span>
                ) : (
                  <>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                      className="mr-2 flex-shrink-0"
                    >
                      <path
                        d="M15.68 8.18182C15.68 7.61455 15.6291 7.07 15.5345 6.54545H8V9.64364H12.3055C12.1164 10.64 11.5491 11.4836 10.6982 12.0509V14.0655H13.2945C14.8073 12.6691 15.68 10.6182 15.68 8.18182Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M8 16C10.16 16 11.9709 15.2873 13.2945 14.0655L10.6982 12.0509C9.98182 12.5309 9.07273 12.8218 8 12.8218C5.92 12.8218 4.15273 11.4036 3.52 9.52H0.832727V11.5927C2.14909 14.2073 4.87273 16 8 16Z"
                        fill="#34A853"
                      />
                      <path
                        d="M3.52 9.52C3.36 9.04 3.27273 8.52727 3.27273 8C3.27273 7.47273 3.36 6.96 3.52 6.48V4.40727H0.832727C0.305455 5.45818 0 6.6691 0 8C0 9.3309 0.305455 10.5418 0.832727 11.5927L3.52 9.52Z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M8 3.17818C9.17091 3.17818 10.2182 3.58545 11.0400 4.37091L13.3527 2.05818C11.9673 0.792727 10.1564 0 8 0C4.87273 0 2.14909 1.79273 0.832727 4.40727L3.52 6.48C4.15273 4.59636 5.92 3.17818 8 3.17818Z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-neutral-400 leading-relaxed pt-1">
                By signing in, you agree to our{' '}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-700 underline underline-offset-2 transition-colors"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
