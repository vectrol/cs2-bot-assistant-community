import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, resolve } from 'node:path'

const API_URL = 'https://api.github.com/repos/armync/ArminC-CS2-Cvars/contents/cvars/cvarlist.md?ref=main'
const OUT_PATH = resolve('scripts/.cache/cs2-cvarlist.md')
const USER_AGENT = 'cs2-bot-improver-assistant'
const TIMEOUT_MS = 120_000
const MAX_ATTEMPTS = 3

async function main() {
  const payload = await fetchWithRetry(API_URL)
  if (!payload?.content || payload.encoding !== 'base64') {
    throw new Error('GitHub API response did not include base64 file content.')
  }

  const raw = Buffer.from(payload.content.replace(/\s/g, ''), 'base64')
  const text = raw.toString('utf8')
  const sha256 = createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase()

  await mkdir(dirname(OUT_PATH), { recursive: true })
  await writeFile(OUT_PATH, text, 'utf8')

  console.log(JSON.stringify({
    source: API_URL,
    output: OUT_PATH,
    size: payload.size,
    lines: text.split('\n').length,
    sha256,
  }, null, 2))
}

async function fetchWithRetry(url) {
  let lastError
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': USER_AGENT,
        },
        signal: controller.signal,
      })
      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status} ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < MAX_ATTEMPTS) {
        const delay = attempt * 2500
        console.warn(`fetch attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}; retrying in ${delay}ms`)
        await new Promise((resolveDelay) => setTimeout(resolveDelay, delay))
      }
    } finally {
      clearTimeout(timeout)
    }
  }
  throw lastError
}

await main()
