import React from 'react'
import styles from './DataFlowDiagram.module.css'

export default function DataFlowDiagram() {
  return (
    <div className={styles.wrapper}>
      <h3 className={styles.heading}>Fluxo de dados: off-chain vs on-chain</h3>
      <div className={styles.flow}>
        <div className={styles.step}>
          <span className={styles.stepLabel}>1. Dado clínico</span>
          <span className={styles.stepDesc}>Profissional insere</span>
        </div>
        <span className={styles.arrow}>→</span>
        <div className={`${styles.box} section-vault`}>
          <span className="badge-vault">DATA VAULT (off-chain)</span>
          <p>Dado criptografado armazenado aqui. Acesso apenas com consentimento do paciente.</p>
        </div>
        <span className={styles.arrow}>→</span>
        <div className={`${styles.box} section-chain`}>
          <span className="badge-chain">BLOCKCHAIN (on-chain)</span>
          <p>Hash + metadados + eventos de consentimento e auditoria. Imutável.</p>
        </div>
      </div>
    </div>
  )
}
