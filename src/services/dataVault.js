/**
 * Data Vault (off-chain): armazena dados clínicos criptografados.
 * O profissional não acessa sem consentimento do paciente.
 */

const STORAGE_KEY = 'healthchain_datavault'

function loadVault() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { records: [] }
  } catch {
    return { records: [] }
  }
}

function saveVault(vault) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vault))
}

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h = h & h
  }
  return 'vault_' + Math.abs(h).toString(16)
}

/** Simula criptografia: em produção seria AES etc. */
function encrypt(text) {
  return btoa(encodeURIComponent(text))
}

function decrypt(encoded) {
  try {
    return decodeURIComponent(atob(encoded))
  } catch {
    return '[dado criptografado]'
  }
}

export const dataVaultService = {
  /** Armazena dado clínico (off-chain). Retorna hash para registrar on-chain. */
  store(patientId, professionalId, data) {
    const vault = loadVault()
    const payload = JSON.stringify({ patientId, professionalId, data, createdAt: new Date().toISOString() })
    const encrypted = encrypt(payload)
    const dataHash = simpleHash(encrypted)
    const record = {
      id: crypto.randomUUID(),
      patientId,
      professionalId,
      dataHash,
      encryptedPayload: encrypted,
      createdAt: new Date().toISOString(),
    }
    vault.records.push(record)
    saveVault(vault)
    return { dataHash, recordId: record.id }
  },

  /** Recupera dado por hash (apenas se consentimento permitir - checado pelo consent service) */
  getByHash(dataHash) {
    const record = this.getRecordByHash(dataHash)
    if (!record) return null
    try {
      const decoded = decrypt(record.encryptedPayload)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  },

  /** Retorna o registro bruto do vault (com id) para um dataHash */
  getRecordByHash(dataHash) {
    const vault = loadVault()
    return vault.records.find(r => r.dataHash === dataHash) || null
  },

  /** Recupera dado por id do registro (útil após atualização, quando o hash muda) */
  getById(recordId) {
    const vault = loadVault()
    const record = vault.records.find(r => r.id === recordId)
    if (!record) return null
    try {
      const decoded = decrypt(record.encryptedPayload)
      return JSON.parse(decoded)
    } catch {
      return null
    }
  },

  /** Atualiza um registro existente. Retorna { previousHash, newHash } para registrar na blockchain. */
  updateById(recordId, newData) {
    const vault = loadVault()
    const idx = vault.records.findIndex(r => r.id === recordId)
    if (idx === -1) return null
    const record = vault.records[idx]
    const previousHash = record.dataHash
    const payload = JSON.stringify({
      patientId: record.patientId,
      professionalId: record.professionalId,
      data: newData,
      createdAt: record.createdAt,
      updatedAt: new Date().toISOString(),
    })
    const encrypted = encrypt(payload)
    const newHash = simpleHash(encrypted)
    record.encryptedPayload = encrypted
    record.dataHash = newHash
    saveVault(vault)
    return { previousHash, newHash }
  },

  getRecordsByPatient(patientId) {
    const vault = loadVault()
    const normalized = String(patientId || '').trim().toLowerCase()
    return vault.records.filter(r => r.patientId === normalized)
  },

  getAllRecords() {
    return loadVault().records
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
