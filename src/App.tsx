import { ThemeProvider } from '@/components/theme-provider'
import { ActiveThemeProvider } from '@/components/active-theme'
import MainLayout from './components/Layout/MainLayout'
import '@/theme.css'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="kt-links-theme">
      <ActiveThemeProvider initialTheme="default">
        <MainLayout />
      </ActiveThemeProvider>
    </ThemeProvider>
  )
}

export default App
