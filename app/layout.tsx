import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" dir="ltr">
        <body>
          <Navbar />
          <main style={{ paddingTop: '70px' }}>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}