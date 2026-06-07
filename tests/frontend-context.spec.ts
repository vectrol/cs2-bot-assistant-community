import { describe, expect, it } from 'vitest'

import { getFrontendContext } from '@/services/tauri/app'

describe('getFrontendContext', () => {
  it('reads the configured vite environment', () => {
    expect(getFrontendContext()).toMatchObject({
      appName: expect.any(String),
      channel: expect.any(String),
      apiBaseUrl: expect.any(String),
      updaterEnabled: expect.any(Boolean),
    })
  })
})
