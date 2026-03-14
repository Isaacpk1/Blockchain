import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import styles from './Login.module.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('professional')
  const { login } = useApp()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    login(email.trim(), role)
    navigate(role === 'professional' ? '/professional' : '/patient')
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>⛓</span>
          <h1>HealthChain</h1>
          <p>Gestão de Dados Clínicos com Blockchain</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>
          <label>
            Acessar como
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="professional">Profissional de saúde</option>
              <option value="patient">Paciente</option>
            </select>
          </label>
          <button type="submit" className={styles.submit}>
            Entrar
          </button>
        </form>
        <p className={styles.hint}>
          Protótipo: use qualquer e-mail para simular login. Dados em localStorage.
        </p>
      </div>
    </div>
  )
}
