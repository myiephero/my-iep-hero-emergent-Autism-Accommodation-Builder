import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'My IEP Hero - Autism Accommodation Builder',
  description: 'Generate personalized IEP accommodations for children with autism',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}