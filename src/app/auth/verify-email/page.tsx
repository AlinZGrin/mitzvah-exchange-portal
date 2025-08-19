"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Mail, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error' | 'expired'>('pending');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    // Handle URL-based verification results
    if (success === 'true') {
      setVerificationStatus('success');
      setMessage('Your email has been verified successfully!');
      return;
    }

    if (error) {
      setVerificationStatus('error');
      switch (error) {
        case 'missing-params':
          setMessage('Missing verification parameters. Please check your email link.');
          break;
        case 'invalid-token':
          setMessage('Invalid or expired verification token.');
          break;
        case 'server-error':
          setMessage('Server error occurred during verification.');
          break;
        default:
          setMessage('An error occurred during verification.');
      }
      return;
    }

    // Auto-verify if token and email are present
    if (token && email) {
      verifyEmail(token, email);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string, email: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setVerificationStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setVerificationStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Network error occurred during verification');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const token = formData.get('token') as string;

    if (!email || !token) {
      setMessage('Please enter both email and verification token');
      return;
    }

    await verifyEmail(token, email);
  };

  const resendVerificationEmail = async (email: string) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      setMessage('Network error occurred while resending email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        {isVerifying && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Verifying your email...</p>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Email Verified!</h3>
              <p className="text-sm text-gray-600">{message}</p>
              <p className="text-sm text-gray-600">
                Welcome to Mitzvah Exchange! Your account is now active.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign In to Your Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/discover"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Explore Mitzvahs
              </Link>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="text-center space-y-4">
            <XCircle className="mx-auto h-16 w-16 text-red-500" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-gray-900">Verification Failed</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
            <div className="space-y-3">
              <Link
                href="/auth/register"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Register Again
              </Link>
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {verificationStatus === 'pending' && !isVerifying && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">Check Your Email</h3>
              <p className="mt-2 text-sm text-gray-600">
                We&apos;ve sent a verification link to your email address. Click the link to verify your account.
              </p>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or verify manually</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleManualVerification} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                  Verification Token
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter verification token from email"
                />
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Verify Email
              </button>
            </form>

            {message && (
              <div className="text-center">
                <p className="text-sm text-gray-600">{message}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
