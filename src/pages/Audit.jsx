import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import styles from './Audit.module.css'

const EVENT_LABELS = {
  DATA_REF: 'Registro de dado (hash on-chain)',
  CONSENT: 'Consentimento',
  ACCESS: 'Acesso a dado',
  MODIFICATION: 'Alteração de dado',
}

export default function Audit() {
  const { blockchain } = useApp()
  const [filter, setFilter] = useState('all')
  const blocks = useMemo(() => blockchain.getAuditTrail(), [blockchain])

  const filtered = useMemo(() => {
    if (filter === 'all') return blocks
    return blocks.filter((b) => b.type === filter)
  }, [blocks, filter])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Registro de Auditoria</h1>
      <p className={styles.subtitle}>
        Trilha imutável na blockchain: quem acessou ou alterou dados e quando.
        Cada evento é registrado on-chain.
      </p>

      <div className={styles.legend}>
        <span className="badge-chain">On-chain</span>
        <span className={styles.legendText}>Todos os eventos abaixo estão registrados na blockchain.</span>
      </div>

      <div className={styles.controls}>
        <label>
          Filtrar por tipo:
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            {Object.entries(EVENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
      </div>

      <section className="section-chain">
        <h2 className={styles.sectionTitle}>Eventos na blockchain</h2>
        {filtered.length === 0 ? (
          <p className={styles.empty}>Nenhum evento registrado.</p>
        ) : (
          <ul className={styles.timeline}>
            {filtered
              .slice()
              .reverse()
              .map((block) => (
                <li key={block.id} className={styles.event}>
                  <div className={styles.eventHeader}>
                    <span className="badge-chain">{block.type}</span>
                    <span className={styles.eventTime}>
                      {new Date(block.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className={styles.eventPayload}>
                    {Object.entries(block.payload).map(([k, v]) => (
                      <div key={k} className={styles.payloadRow}>
                        <span className={styles.payloadKey}>{k}:</span>
                        <span className={styles.payloadVal}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={styles.eventHash}>
                    Hash: <code>{block.hash}</code>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      <div className={styles.vaultNote}>
        <span className="badge-vault">Data Vault (off-chain)</span>
        <p>
          Os dados clínicos em si ficam criptografados no Data Vault. Aqui na auditoria aparecem apenas
          as referências (hashes) e eventos de consentimento/acesso registrados on-chain.
        </p>
      </div>
    </div>
  )
}
