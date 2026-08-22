import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './context/AppContext'
import { TiraPerAggiornare } from './components/TiraPerAggiornare'
import { avviaAggiornamentoAutomatico } from './lib/aggiornamento'
import './index.css'

avviaAggiornamentoAutomatico()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppProvider>
        <TiraPerAggiornare>
          <App />
        </TiraPerAggiornare>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)
