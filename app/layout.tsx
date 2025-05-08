import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from './components/ThemeProvider'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from './components/Footer'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" dir="ltr">
        <body>
          <ThemeProvider>
            <Navbar />
            <main style={{ paddingTop: '70px' }}>{children}</main>
          </ThemeProvider>
        </body>
      </html>
      <Footer/>

    </ClerkProvider>
  )
}