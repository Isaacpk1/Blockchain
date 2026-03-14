import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useApp } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import ProfessionalDashboard from './pages/ProfessionalDashboard'
import PatientDashboard from './pages/PatientDashboard'
import Audit from './pages/Audit'

function ProtectedRoute({ children, allowedRole }) {
  const { user, role } = useApp()
  if (!user) return <Navigate to="/" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to={role === 'professional' ? '/professional' : '/patient'} replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/professional"
        element={
          <ProtectedRoute allowedRole="professional">
            <Layout role="professional" />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfessionalDashboard />} />
      </Route>
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRole="patient">
            <Layout role="patient" />
          </ProtectedRoute>
        }
      >
        <Route index element={<PatientDashboard />} />
      </Route>
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
