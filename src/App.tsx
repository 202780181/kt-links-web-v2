import { ThemeProvider } from '@/components/theme/theme-provider'
import { ActiveThemeProvider } from '@/components/theme/active-theme'
import { Toaster } from '@/components/ui/sonner'
import MainLayout from './components/layout/main-layout'
import '@/theme.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kt-links-theme">
      <ActiveThemeProvider initialTheme="default">
        <MainLayout />
        <Toaster position="top-center" richColors/>
      </ActiveThemeProvider>
    </ThemeProvider>
  )
}

export default App
