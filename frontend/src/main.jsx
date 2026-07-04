import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AdminPage from './AdminPage.jsx'
import './index.css'
import ErrorBoundary from './ErrorBoundary.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
  </ErrorBoundary>,
)
