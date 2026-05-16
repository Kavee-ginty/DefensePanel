import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext.jsx'
import './index.css'
import ModeSelection from './pages/ModeSelection.jsx'
import ContextUpload from './pages/ContextUpload.jsx'
import SimulationArena from './pages/SimulationArena.jsx'
import DebriefDashboard from './pages/DebriefDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ModeSelection />} />
          <Route path="/setup" element={<ContextUpload />} />
          <Route path="/arena" element={<SimulationArena />} />
          <Route path="/debrief" element={<DebriefDashboard />} />
        </Routes>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#fafafa',
            },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  </StrictMode>,
)
