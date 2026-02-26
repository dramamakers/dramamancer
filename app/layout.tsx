import ToastProvider from '@/app/editor/components/ToastProvider';
import { AuthProvider } from '@/components/Auth/AuthContext';
import LoginModalProvider from '@/components/Auth/LoginModalProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MenuProvider } from '@/components/Menu';
import { TooltipProvider } from '@/components/Tooltip';
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dramamancer',
  description: 'Interactive narrative engine',
  icons: {
    icon: '/llama.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`antialiased h-full bg-white dark:bg-slate-900 ${dmSans.className}`}>
        <ErrorBoundary>
          <AuthProvider>
            <LoginModalProvider>
              <MenuProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </MenuProvider>
              <ToastProvider />
            </LoginModalProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
