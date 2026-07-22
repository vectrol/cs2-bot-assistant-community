import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ReleaseNotesView from '@/views/ReleaseNotesView.vue'
import { fetchSoftwareReleaseHistory } from '@/services/software-updates'

vi.mock('@/services/software-updates', () => ({
  fetchSoftwareReleaseHistory: vi.fn(),
}))

vi.mock('@/services/tauri/app', () => ({
  openExternalUrl: vi.fn(),
}))

const fetchSoftwareReleaseHistoryMock = vi.mocked(fetchSoftwareReleaseHistory)

function mountView() {
  return mount(ReleaseNotesView, {
    global: {
      stubs: {
        SummaryStrip: {
          props: ['items'],
          template: '<div><span v-for="item in items" :key="item.label">{{ item.label }}: {{ item.value }}</span></div>',
        },
        CollapsiblePanel: {
          props: ['title', 'subtitle', 'badge'],
          template: '<section><h4>{{ title }}</h4><p>{{ subtitle }}</p><slot /></section>',
        },
      },
    },
  })
}

describe('ReleaseNotesView', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('keeps cloud release notes when cloud and builtin entries share a version', async () => {
    fetchSoftwareReleaseHistoryMock.mockResolvedValue({
      status: 'online',
      payload: makePayload(),
    })

    const wrapper = mountView()
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('Cloud 100.0.0 Title')
    expect(wrapper.text()).toContain('Cloud 100.0.0 Summary')
    expect(wrapper.text()).toContain('Cloud 100.0.0 Item')
    expect(wrapper.text()).toContain('日志来源: 线上 + 内置')
  })

  it('shows builtin entries that are missing from cloud history', async () => {
    fetchSoftwareReleaseHistoryMock.mockResolvedValue({
      status: 'online',
      payload: makePayload(),
    })

    const wrapper = mountView()
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('0.4.4 设置页、自启动与初次安装优化')
    expect(wrapper.text()).toContain('新增设置页面，集中管理外观主题和程序行为。')
    expect(wrapper.text()).toContain('修复设定打身体时 BOT 爆头率仍然偏高的问题')
  })

  it('uses the release history fetch path for the release notes page', async () => {
    fetchSoftwareReleaseHistoryMock.mockResolvedValue({
      status: 'online',
      payload: makePayload(),
    })

    mountView()
    await vi.dynamicImportSettled()

    expect(fetchSoftwareReleaseHistoryMock).toHaveBeenCalledTimes(1)
  })

  it('shows a clear status when the update feed url is not configured', async () => {
    fetchSoftwareReleaseHistoryMock.mockResolvedValue({
      status: 'not-configured',
      payload: null,
    })

    const wrapper = mountView()
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('日志来源: 线上源未配置')
    expect(wrapper.text()).toContain('0.4.4 设置页、自启动与初次安装优化')
  })

  it('shows the builtin source label and keeps builtin entries when cloud fetch fails', async () => {
    fetchSoftwareReleaseHistoryMock.mockResolvedValue({
      status: 'failed',
      payload: null,
    })

    const wrapper = mountView()
    await vi.dynamicImportSettled()

    expect(wrapper.text()).toContain('日志来源: 内置日志')
    expect(wrapper.text()).toContain('0.4.4 设置页、自启动与初次安装优化')
  })
})

function makePayload() {
  return {
    projectId: 'cs2-bot-improver',
    channel: 'prod',
    currentVersion: '0.4.4',
    hasUpdate: false,
    latest: null,
    history: [
      {
        projectId: 'cs2-bot-improver',
        channel: 'prod',
        version: '100.0.0',
        title: 'Cloud 100.0.0 Title',
        summary: 'Cloud 100.0.0 Summary',
        items: ['Cloud 100.0.0 Item'],
        severity: 'normal' as const,
        publishedAt: '2026-07-01T12:00:00.000Z',
        download: {
          type: 'quark',
          label: '夸克网盘',
          url: 'https://example.com/download',
        },
      },
    ],
  }
}
