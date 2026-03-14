import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Layout.module.css'

export default function Layout({ role, showAuditLink }) {
  const { user, logout, role: currentRole } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⛓</span>
          <span>HealthChain</span>
        </div>
        <nav className={styles.nav}>
          {currentRole === 'professional' && (
            <NavLink to="/professional" end className={({ isActive }) => (isActive ? styles.active : '')}>
              Painel
            </NavLink>
          )}
          {currentRole === 'patient' && (
            <NavLink to="/patient" end className={({ isActive }) => (isActive ? styles.active : '')}>
              Meus Dados
            </NavLink>
          )}
          {showAuditLink !== false && (
            <NavLink to="/audit" className={({ isActive }) => (isActive ? styles.active : '')}>
              Auditoria
            </NavLink>
          )}
        </nav>
        <div className={styles.user}>
          <span className={styles.role}>{currentRole === 'professional' ? 'Profissional' : 'Paciente'}</span>
          <span className={styles.email}>{user?.email}</span>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
