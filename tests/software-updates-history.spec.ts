import { afterEach, describe, expect, it, vi } from 'vitest'

const baseConfig = {
    appName: 'CS2人机助手社区版',
      appVersion: '',
      appBrandLabel: 'CS2 BOT ASSISTANT COMMUNITY',
  channel: 'prod',
  projectId: 'cs2-bot-improver',
    workspaceName: 'CS2人机助手社区版工作区',
  themeStorageKey: 'cs2-bot-improver.theme',
  customCommandsStorageKey: 'cs2-bot-improver.custom-commands',
  persistedRootsStorageKey: 'cs2-bot-improver.persistedRoots',
}

describe('fetchSoftwareReleaseHistory', () => {
  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('fetches release history even when updater prompts are disabled', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        projectId: 'cs2-bot-improver',
        channel: 'prod',
        currentVersion: '0.4.4',
        hasUpdate: false,
        latest: null,
        history: [
          {
            projectId: 'cs2-bot-improver',
            channel: 'prod',
            version: '0.4.3',
            title: '线上记录',
            summary: '',
            items: [],
            severity: 'normal',
            publishedAt: '2026-07-01T12:00:00.000Z',
            download: {
              type: 'quark',
              label: '打开夸克网盘',
              url: 'https://example.com/download',
            },
          },
        ],
      }),
    })
    vi.stubGlobal('fetch', fetchMock)
    const { fetchSoftwareReleaseHistory } = await loadService({
      updaterEnabled: false,
      updateFeedUrl: 'https://example.com/api/software-updates/cs2-bot-improver',
    })

    const result = await fetchSoftwareReleaseHistory()

    expect(result.status).toBe('online')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('currentVersion=0.4.4')
  })

  it('returns not-configured when the update feed url is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { fetchSoftwareReleaseHistory } = await loadService({
      updaterEnabled: false,
      updateFeedUrl: '',
    })

    const result = await fetchSoftwareReleaseHistory()

    expect(result.status).toBe('not-configured')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns failed when the feed request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failed')))
    const { fetchSoftwareReleaseHistory } = await loadService({
      updaterEnabled: true,
      updateFeedUrl: 'https://example.com/api/software-updates/cs2-bot-improver',
    })

    const result = await fetchSoftwareReleaseHistory()

    expect(result.status).toBe('failed')
  })
})

async function loadService(config: { updaterEnabled: boolean; updateFeedUrl: string }) {
  vi.doMock('@/config/app', () => ({
    appConfig: {
      ...baseConfig,
      ...config,
    },
  }))
  return await import('@/services/software-updates')
}
