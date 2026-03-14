/**
 * Simulador de blockchain (on-chain).
 * Registra hashes, metadados e eventos de auditoria de forma imutável.
 */

const STORAGE_KEY = 'healthchain_blockchain'

function loadChain() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { blocks: [], nextId: 1 }
  } catch {
    return { blocks: [], nextId: 1 }
  }
}

function saveChain(chain) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chain))
}

function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h = ((h << 5) - h) + c
    h = h & h
  }
  return '0x' + Math.abs(h).toString(16).padStart(16, '0')
}

export const blockchainService = {
  /** Registra um novo bloco/evento na chain */
  recordEvent(type, payload) {
    const chain = loadChain()
    const block = {
      id: chain.nextId++,
      timestamp: new Date().toISOString(),
      type,
      payload: { ...payload },
      previousHash: chain.blocks.length
        ? chain.blocks[chain.blocks.length - 1].hash
        : '0x0',
    }
    block.hash = hash(JSON.stringify(block))
    chain.blocks.push(block)
    saveChain(chain)
    return block
  },

  /** Registra hash + metadados de um dado no Data Vault (on-chain) */
  registerDataRef(patientId, dataHash, metadata) {
    return this.recordEvent('DATA_REF', {
      patientId,
      dataHash,
      ...metadata,
    })
  },

  /** Registra consentimento (smart contract simulado) */
  recordConsent(patientId, professionalId, action, requestId) {
    return this.recordEvent('CONSENT', {
      patientId,
      professionalId,
      action, // 'granted' | 'denied'
      requestId,
    })
  },

  /** Registra acesso a dados */
  recordAccess(patientId, professionalId, dataRef) {
    return this.recordEvent('ACCESS', {
      patientId,
      professionalId,
      dataRef,
    })
  },

  /** Registra alteração */
  recordModification(patientId, professionalId, dataRef, previousHash) {
    return this.recordEvent('MODIFICATION', {
      patientId,
      professionalId,
      dataRef,
      previousHash,
    })
  },

  /** Retorna toda a trilha de auditoria */
  getAuditTrail() {
    return loadChain().blocks
  },

  /** Limpa (apenas para protótipo/demo) */
  reset() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
