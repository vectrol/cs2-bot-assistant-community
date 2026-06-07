import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import SoftwareUpdateModal from '@/components/SoftwareUpdateModal.vue'
import { resetSoftwareUpdateStateForTest } from '@/features/software-updates/state'
import type { SoftwareRelease, SoftwareUpdatePayload } from '@/features/software-updates/types'
import { fetchSoftwareUpdates } from '@/services/software-updates'

vi.mock('@/services/software-updates', () => ({
  fetchSoftwareUpdates: vi.fn(),
}))

vi.mock('@/services/tauri/app', () => ({
  openExternalUrl: vi.fn(),
}))

const fetchSoftwareUpdatesMock = vi.mocked(fetchSoftwareUpdates)

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>()

  get length() {
    return this.items.size
  }

  clear() {
    this.items.clear()
  }

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.items.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.items.delete(key)
  }

  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
}

function makePayload(severity: SoftwareRelease['severity'], version = '9.9.9'): SoftwareUpdatePayload {
  return {
    projectId: 'cs2-bot-improver',
    channel: 'prod',
    currentVersion: '0.3.9',
    hasUpdate: true,
    latest: {
      projectId: 'cs2-bot-improver',
      channel: 'prod',
      version,
      title: `v${version}`,
      summary: '',
      items: [],
      severity,
      publishedAt: '2026-06-06',
      download: {
        type: 'quark',
        label: '打开夸克网盘',
        url: 'https://example.com/download',
      },
    },
    history: [],
  }
}

async function mountModal(payload: SoftwareUpdatePayload) {
  fetchSoftwareUpdatesMock.mockResolvedValue(payload)
  const wrapper = mount(SoftwareUpdateModal)
  await vi.dynamicImportSettled()
  return wrapper
}

describe('SoftwareUpdateModal', () => {
  beforeEach(() => {
    resetSoftwareUpdateStateForTest()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: new MemoryStorage(),
    })
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('persists dismissed normal updates by version', async () => {
    const wrapper = await mountModal(makePayload('normal'))

    expect(wrapper.text()).toContain('发现新版本')
    await wrapper.find('.ghost-button').trigger('click')

    expect(window.localStorage.getItem('cs2-bot-improver.software-update-seen')).toBe('9.9.9')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    const nextWrapper = await mountModal(makePayload('normal'))

    expect(nextWrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('dismisses recommended updates only for the current app run', async () => {
    const wrapper = await mountModal(makePayload('recommended'))

    expect(wrapper.text()).toContain('推荐更新')
    expect(wrapper.text()).toContain('这个版本包含推荐升级内容。不更新也可以继续使用。')
    await wrapper.find('.ghost-button').trigger('click')

    expect(window.localStorage.getItem('cs2-bot-improver.software-update-seen')).toBeNull()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    const nextWrapper = await mountModal(makePayload('recommended'))

    expect(nextWrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(nextWrapper.text()).toContain('推荐更新')
  })

  it('does not allow critical updates to be dismissed', async () => {
    const wrapper = await mountModal(makePayload('critical'))

    expect(wrapper.text()).toContain('强制更新')
    expect(wrapper.text()).toContain('当前版本需要更新后才能继续使用软件。')
    expect(wrapper.find('.ghost-button').exists()).toBe(false)
  })
})
