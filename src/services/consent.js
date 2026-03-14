/**
 * Gestão de consentimentos: solicitações pendentes e respostas.
 * Integra com blockchain para registrar consent (on-chain).
 */

const STORAGE_KEY = 'healthchain_consent_requests'

function loadRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRequests(requests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export const consentService = {
  /** Cria solicitação de consentimento (ao profissional registrar dado) */
  createRequest({ patientId, professionalId, professionalName, type, dataHash, summary, recordId }) {
    const requests = loadRequests()
    const normalizedPatientId = String(patientId).trim().toLowerCase()
    const req = {
      id: crypto.randomUUID(),
      patientId: normalizedPatientId,
      professionalId,
      professionalName,
      type, // 'include_data' | 'access_data'
      dataHash,
      recordId: recordId || null,
      summary,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    requests.push(req)
    saveRequests(requests)
    return req
  },

  /** Atualiza o dataHash da solicitação (quando o dado é alterado no vault) */
  updateDataHash(oldDataHash, newDataHash) {
    const requests = loadRequests()
    const req = requests.find(r => r.dataHash === oldDataHash)
    if (!req) return false
    req.dataHash = newDataHash
    saveRequests(requests)
    return true
  },

  getPendingForPatient(patientId) {
    const normalized = String(patientId || '').trim().toLowerCase()
    return loadRequests().filter(r => r.patientId === normalized && r.status === 'pending')
  },

  getPendingForProfessional(professionalId) {
    return loadRequests().filter(r => r.professionalId === professionalId && r.status === 'pending')
  },

  getAllForPatient(patientId) {
    const normalized = String(patientId || '').trim().toLowerCase()
    return loadRequests().filter(r => r.patientId === normalized)
  },

  getAllForProfessional(professionalId) {
    return loadRequests().filter(r => r.professionalId === professionalId)
  },

  /** Consentimentos concedidos para este profissional acessar dados deste paciente */
  getGrantedForProfessionalAndPatient(professionalId, patientId) {
    const normalized = String(patientId || '').trim().toLowerCase()
    return loadRequests().filter(
      r =>
        r.professionalId === professionalId &&
        r.patientId === normalized &&
        r.status === 'granted'
    )
  },

  /** Paciente autoriza ou nega. Registra on-chain. */
  respond(requestId, granted, blockchain) {
    const requests = loadRequests()
    const idx = requests.findIndex(r => r.id === requestId)
    if (idx === -1) return null
    requests[idx].status = granted ? 'granted' : 'denied'
    requests[idx].respondedAt = new Date().toISOString()
    saveRequests(requests)
    blockchain.recordConsent(
      requests[idx].patientId,
      requests[idx].professionalId,
      granted ? 'granted' : 'denied',
      requestId
    )
    return requests[idx]
  },

  getRequest(requestId) {
    return loadRequests().find(r => r.id === requestId)
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
