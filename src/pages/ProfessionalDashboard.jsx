import React, { useState, useCallback } from 'react'
import { useApp } from '../context/AppContext'
import DataFlowDiagram from '../components/DataFlowDiagram'
import styles from './ProfessionalDashboard.module.css'

export default function ProfessionalDashboard() {
  const { user, blockchain, dataVault, consent } = useApp()
  const [patientId, setPatientId] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState(null)

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      setMessage(null)
      const normalizedPatientId = patientId.trim().toLowerCase()
      if (!normalizedPatientId || !summary.trim() || !content.trim()) {
        setMessage({ type: 'error', text: 'Preencha todos os campos.' })
        return
      }
      try {
        const { dataHash, recordId } = dataVault.store(normalizedPatientId, user.id, {
          summary,
          content,
          professionalEmail: user.email,
        })
        blockchain.registerDataRef(normalizedPatientId, dataHash, {
          recordId,
          summary,
          professionalId: user.id,
        })
        consent.createRequest({
          patientId: normalizedPatientId,
          professionalId: user.id,
          professionalName: user.email,
          type: 'include_data',
          dataHash,
          recordId,
          summary,
        })
        setMessage({
          type: 'success',
          text: 'Dado registrado no Data Vault. Hash registrado on-chain. Solicitação de consentimento enviada ao paciente.',
        })
        setPatientId('')
        setSummary('')
        setContent('')
      } catch (err) {
        setMessage({ type: 'error', text: err.message || 'Erro ao registrar.' })
      }
    },
    [user, blockchain, dataVault, consent, patientId, summary, content]
  )

  const pendingRequests = consent.getPendingForProfessional(user?.id) || []

  const [searchPatientId, setSearchPatientId] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [expandedHash, setExpandedHash] = useState(null)
  const [accessRecorded, setAccessRecorded] = useState(new Set())

  const handleSearch = useCallback(
    (e) => {
      e?.preventDefault()
      const normalized = (searchPatientId || '').trim().toLowerCase()
      if (!normalized) {
        setSearchResult({ error: 'Informe o ID do paciente (e-mail).' })
        return
      }
      const granted = consent.getGrantedForProfessionalAndPatient(user?.id, normalized)
      const items = granted.map((req) => {
        const record = dataVault.getRecordByHash(req.dataHash)
        const recordId = req.recordId || record?.id
        const vaultData = recordId
          ? dataVault.getById(recordId)
          : dataVault.getByHash(req.dataHash)
        return {
          ...req,
          recordId,
          record,
          vaultData,
        }
      })
      setSearchResult({ patientId: normalized, items })
      setExpandedHash(null)
      setEditingRecordId(null)
    },
    [user?.id, searchPatientId, consent, dataVault]
  )

  const [editingRecordId, setEditingRecordId] = useState(null)
  const [editSummary, setEditSummary] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editMessage, setEditMessage] = useState(null)

  const handleViewDetails = useCallback(
    (dataHash, patientIdForAccess) => {
      setExpandedHash((prev) => (prev === dataHash ? null : dataHash))
      setEditingRecordId(null)
      if (!accessRecorded.has(dataHash)) {
        blockchain.recordAccess(patientIdForAccess, user?.id, dataHash)
        setAccessRecorded((prev) => new Set(prev).add(dataHash))
      }
    },
    [blockchain, user?.id, accessRecorded]
  )

  const handleStartEdit = useCallback((item) => {
    setEditingRecordId(item.recordId || item.record?.id)
    setEditSummary(item.vaultData?.data?.summary ?? item.summary ?? '')
    setEditContent(item.vaultData?.data?.content ?? '')
    setEditMessage(null)
  }, [])

  const handleSaveEdit = useCallback(
    (item) => {
      const recordId = item.recordId || item.record?.id
      if (!recordId) {
        setEditMessage({ type: 'error', text: 'Registro não encontrado.' })
        return
      }
      if (!editSummary.trim() || !editContent.trim()) {
        setEditMessage({ type: 'error', text: 'Preencha resumo e conteúdo.' })
        return
      }
      setEditMessage(null)
      try {
        const result = dataVault.updateById(recordId, {
          summary: editSummary.trim(),
          content: editContent.trim(),
          professionalEmail: user?.email,
        })
        if (result) {
          consent.updateDataHash(result.previousHash, result.newHash)
          blockchain.recordModification(
            item.patientId,
            user?.id,
            result.newHash,
            result.previousHash
          )
          setEditMessage({ type: 'success', text: 'Dado atualizado. Alteração registrada na blockchain.' })
          setEditingRecordId(null)
          handleSearch()
        }
      } catch (err) {
        setEditMessage({ type: 'error', text: err.message || 'Erro ao salvar.' })
      }
    },
    [dataVault, consent, blockchain, user?.id, user?.email, editSummary, editContent, handleSearch]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingRecordId(null)
    setEditMessage(null)
  }, [])

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Área do Profissional de Saúde</h1>
      <p className={styles.subtitle}>
        Registre informações clínicas. Os dados são criptografados e armazenados no Data Vault (off-chain);
        apenas hash e metadados vão para a blockchain. O paciente precisa autorizar.
      </p>

      <DataFlowDiagram />

      <section className={styles.section}>
        <h2>Registrar dado clínico</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            ID do paciente (use o mesmo e-mail que o paciente usa para entrar)
            <input
              type="text"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              placeholder="paciente@email.com"
            />
          </label>
          <label>
            Resumo (visível na solicitação)
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Ex.: Resultado de hemograma"
            />
          </label>
          <label>
            Conteúdo (dado sensível, fica no Data Vault criptografado)
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Detalhes clínicos..."
              rows={4}
            />
          </label>
          <button type="submit">Registrar e solicitar consentimento</button>
        </form>
        {message && (
          <div className={message.type === 'success' ? styles.msgSuccess : styles.msgError}>
            {message.text}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Buscar dados do paciente</h2>
        <p className={styles.hint}>
          Só é possível acessar dados após o paciente autorizar. Informe o e-mail (ID) do paciente.
        </p>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            value={searchPatientId}
            onChange={(e) => setSearchPatientId(e.target.value)}
            placeholder="paciente@email.com"
          />
          <button type="submit">Buscar</button>
        </form>
        {searchResult?.error && (
          <p className={styles.msgError}>{searchResult.error}</p>
        )}
        {searchResult?.items && (
          <div className={styles.searchResult}>
            {searchResult.items.length === 0 ? (
              <p className={styles.empty}>
                Nenhum dado com acesso autorizado para este paciente, ou ID não encontrado.
              </p>
            ) : (
              <>
                <p className={styles.patientLabel}>
                  Paciente: <strong>{searchResult.patientId}</strong> — {searchResult.items.length} registro(s) com acesso autorizado
                </p>
                <ul className={styles.dataList}>
                  {searchResult.items.map((item) => {
                    const recordId = item.recordId || item.record?.id
                    const isExpanded = expandedHash === item.dataHash
                    const isEditing = editingRecordId === recordId
                    const data = item.vaultData?.data

                    return (
                      <li key={item.id} className={styles.dataItem}>
                        <div className={styles.dataItemHeader}>
                          <span className={styles.dataItemTitle}>
                            {data?.summary ?? item.summary}
                          </span>
                          <span className={styles.dataItemDate}>
                            {item.respondedAt
                              ? new Date(item.respondedAt).toLocaleString('pt-BR')
                              : new Date(item.createdAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {!isEditing ? (
                          <>
                            <button
                              type="button"
                              className={styles.detailBtn}
                              onClick={() => handleViewDetails(item.dataHash, item.patientId)}
                            >
                              {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                            </button>
                            {isExpanded && (
                              <div className={`${styles.vaultDetail} section-vault`}>
                                <span className="badge-vault">Data Vault (off-chain)</span>
                                {item.vaultData ? (
                                  <div className={styles.dataFields}>
                                    <div className={styles.field}>
                                      <span className={styles.fieldLabel}>Resumo</span>
                                      <span>{data?.summary ?? '—'}</span>
                                    </div>
                                    <div className={styles.field}>
                                      <span className={styles.fieldLabel}>Conteúdo</span>
                                      <p className={styles.fieldContent}>{data?.content ?? '—'}</p>
                                    </div>
                                    <div className={styles.field}>
                                      <span className={styles.fieldLabel}>Registrado por</span>
                                      <span>{data?.professionalEmail ?? '—'}</span>
                                    </div>
                                    <div className={styles.field}>
                                      <span className={styles.fieldLabel}>Data do registro</span>
                                      <span>{item.vaultData?.createdAt ? new Date(item.vaultData.createdAt).toLocaleString('pt-BR') : '—'}</span>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.editBtn}
                                      onClick={() => handleStartEdit(item)}
                                    >
                                      Alterar dado
                                    </button>
                                    <p className={styles.auditNote}>
                                      Acesso registrado na blockchain (Auditoria).
                                    </p>
                                  </div>
                                ) : (
                                  <p className={styles.empty}>Dado não encontrado no Data Vault.</p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.editForm}>
                            <span className="badge-vault">Alterar dado (off-chain + on-chain)</span>
                            <label>
                              Resumo
                              <input
                                value={editSummary}
                                onChange={(e) => setEditSummary(e.target.value)}
                              />
                            </label>
                            <label>
                              Conteúdo
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={4}
                              />
                            </label>
                            {editMessage && (
                              <p className={editMessage.type === 'success' ? styles.msgSuccess : styles.msgError}>
                                {editMessage.text}
                              </p>
                            )}
                            <div className={styles.editActions}>
                              <button type="button" className={styles.saveBtn} onClick={() => handleSaveEdit(item)}>
                                Salvar
                              </button>
                              <button type="button" className={styles.cancelBtn} onClick={handleCancelEdit}>
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Solicitações pendentes de consentimento</h2>
        <p className={styles.hint}>
          Estes registros aguardam autorização do paciente. Sem consentimento, você não acessa o dado no Data Vault.
        </p>
        {pendingRequests.length === 0 ? (
          <p className={styles.empty}>Nenhuma solicitação pendente.</p>
        ) : (
          <ul className={styles.list}>
            {pendingRequests.map((req) => (
              <li key={req.id} className={styles.listItem}>
                <span><strong>Paciente:</strong> {req.patientId}</span>
                <span><strong>Resumo:</strong> {req.summary}</span>
                <span className={styles.badgeChain}>Aguardando consentimento (on-chain)</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
