import React, { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import styles from './PatientDashboard.module.css'

export default function PatientDashboard() {
  const { user, blockchain, consent, dataVault } = useApp()
  const patientId = (user?.email || '').trim().toLowerCase()
  const [processing, setProcessing] = useState(null)
  const [, setRefresh] = useState(0)

  // Listas lidas do consent a cada render (use "Atualizar" se abrir em outra aba)
  const pending = consent.getPendingForPatient(patientId) || []
  const history = consent.getAllForPatient(patientId) || []

  // Dados clínicos do próprio paciente (todos os registros no Data Vault para este paciente)
  const myRecords = (dataVault.getRecordsByPatient(patientId) || []).map((record) => {
    const vaultData = dataVault.getByHash(record.dataHash)
    return { record, vaultData }
  })

  const handleRespond = useCallback(
    (requestId, granted) => {
      setProcessing(requestId)
      consent.respond(requestId, granted, blockchain)
      setProcessing(null)
    },
    [consent, blockchain]
  )

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Área do Paciente</h1>
      <p className={styles.subtitle}>
        Você tem controle total sobre seus dados. Em produção, notificações seriam enviadas por app, e-mail ou SMS.
        Autorize ou negue acessos em tempo real; cada decisão é registrada na blockchain (on-chain).
      </p>

      <section className={styles.section}>
        <h2>Notificações — Solicitações pendentes</h2>
        <p className={styles.hint}>
          Profissionais solicitaram incluir ou acessar seus dados. Escolha autorizar ou negar.
          Use o mesmo e-mail no login que o profissional informou como &quot;ID do paciente&quot;.
        </p>
        <button type="button" className={styles.refreshBtn} onClick={() => setRefresh((k) => k + 1)}>
          Atualizar lista
        </button>
        {pending.length === 0 ? (
          <p className={styles.empty}>Nenhuma solicitação pendente no momento.</p>
        ) : (
          <ul className={styles.list}>
            {pending.map((req) => (
              <li key={req.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className="badge-chain">Solicitação on-chain</span>
                  <span className={styles.date}>
                    {new Date(req.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p><strong>Profissional:</strong> {req.professionalName}</p>
                <p><strong>Resumo:</strong> {req.summary}</p>
                <p><strong>Tipo:</strong> {req.type === 'include_data' ? 'Inclusão de dado' : 'Acesso a dado'}</p>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.btnGrant}
                    onClick={() => handleRespond(req.id, true)}
                    disabled={processing === req.id}
                  >
                    Autorizar
                  </button>
                  <button
                    type="button"
                    className={styles.btnDeny}
                    onClick={() => handleRespond(req.id, false)}
                    disabled={processing === req.id}
                  >
                    Negar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Meus dados clínicos</h2>
        <p className={styles.hint}>
          Registros armazenados no Data Vault (off-chain) associados a você. Apenas profissionais autorizados por você podem acessá-los.
        </p>
        <button type="button" className={styles.refreshBtn} onClick={() => setRefresh((k) => k + 1)}>
          Atualizar lista
        </button>
        {myRecords.length === 0 ? (
          <p className={styles.empty}>Nenhum dado clínico registrado ainda.</p>
        ) : (
          <ul className={styles.myDataList}>
            {myRecords.map(({ record, vaultData }) => (
              <li key={record.id} className={styles.myDataCard}>
                <div className={`${styles.myDataCardInner} section-vault`}>
                  <span className="badge-vault">Data Vault (off-chain)</span>
                  <div className={styles.myDataFields}>
                    <div className={styles.myDataField}>
                      <span className={styles.fieldLabel}>Resumo</span>
                      <span>{vaultData?.data?.summary ?? '—'}</span>
                    </div>
                    <div className={styles.myDataField}>
                      <span className={styles.fieldLabel}>Conteúdo</span>
                      <p className={styles.myDataContent}>{vaultData?.data?.content ?? '—'}</p>
                    </div>
                    <div className={styles.myDataField}>
                      <span className={styles.fieldLabel}>Registrado por</span>
                      <span>{vaultData?.data?.professionalEmail ?? '—'}</span>
                    </div>
                    <div className={styles.myDataField}>
                      <span className={styles.fieldLabel}>Data</span>
                      <span>
                        {record.createdAt ? new Date(record.createdAt).toLocaleString('pt-BR') : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <h2>Histórico de consentimentos</h2>
        {history.length === 0 ? (
          <p className={styles.empty}>Nenhum registro ainda.</p>
        ) : (
          <ul className={styles.historyList}>
            {history
              .slice()
              .sort((a, b) => new Date(b.respondedAt || b.createdAt) - new Date(a.respondedAt || a.createdAt))
              .map((req) => (
                <li key={req.id} className={styles.historyItem}>
                  <span>{req.professionalName}</span>
                  <span>{req.summary}</span>
                  <span
                    className={
                      req.status === 'granted'
                        ? styles.statusGranted
                        : req.status === 'denied'
                        ? styles.statusDenied
                        : styles.statusPending
                    }
                  >
                    {req.status === 'pending' ? 'Pendente' : req.status === 'granted' ? 'Autorizado' : 'Negado'}
                  </span>
                  <span className={styles.date}>
                    {req.respondedAt
                      ? new Date(req.respondedAt).toLocaleString('pt-BR')
                      : new Date(req.createdAt).toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  )
}
