import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Global Setup para testes E2E
 * Carrega variáveis de ambiente do .env.local antes de todos os testes
 */
async function globalSetup() {
  // Carrega .env.local da raiz do projeto
  const envPath = path.resolve(__dirname, '../../.env.local')
  dotenv.config({ path: envPath })

  // Verifica se MASTER_PASSWORD foi carregada
  if (!process.env.MASTER_PASSWORD) {
    console.warn('⚠️  MASTER_PASSWORD não encontrada no .env.local')
    console.warn('   Os testes de login irão falhar.')
  }
}

export default globalSetup
