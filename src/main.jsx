import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import { MultiplayerProvider } from './context/MultiplayerContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <GameProvider>
        <MultiplayerProvider>
          <App />
        </MultiplayerProvider>
      </GameProvider>
    </AuthProvider>
  </StrictMode>,
)
