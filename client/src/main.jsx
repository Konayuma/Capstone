import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import * as AppModule from './App.jsx'

const App = AppModule.default ?? AppModule.App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
