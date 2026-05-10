import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { EntityProvider } from './api/EntityContext'
import TopBar from './components/TopBar'
import SubNav from './components/SubNav'
import HomePage from './pages/HomePage'
import EntityPage from './pages/EntityPage'
import BudgetingPage from './pages/BudgetingPage'

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full">
      <TopBar />
      <SubNav />
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

export default function App() {
  return (
    <EntityProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AppShell>
                <main className="flex-1 overflow-y-auto">
                  <HomePage />
                </main>
              </AppShell>
            }
          />
          <Route
            path="/entity/:id/:tab?"
            element={
              <AppShell>
                <EntityPage />
              </AppShell>
            }
          />
          <Route
            path="/budgeting"
            element={
              <AppShell>
                <BudgetingPage />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </EntityProvider>
  )
}
