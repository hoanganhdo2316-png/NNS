import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './HomePage.jsx'
import App from './App.jsx'
import AgentPage from './AgentPage.jsx'
import AdminPage from './AdminPage.jsx'
import AgentDetailPage from './AgentDetailPage.jsx'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth/zalo/callback" element={<HomePage />} />
        <Route path="/chat" element={<App />} />
        <Route path="/agent" element={<AgentPage />} />
        <Route path="/agent/:id" element={<AgentDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
  </ErrorBoundary>,
)
