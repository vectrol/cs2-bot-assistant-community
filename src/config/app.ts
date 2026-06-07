export const appConfig = {
  appName: import.meta.env.VITE_APP_NAME,
  appVersion: __APP_VERSION__,
  appBrandLabel: import.meta.env.VITE_APP_BRAND_LABEL,
  channel: import.meta.env.VITE_APP_CHANNEL,
  updaterEnabled: import.meta.env.VITE_ENABLE_UPDATER === 'true',
  updateFeedUrl: import.meta.env.VITE_UPDATE_FEED_URL,
  projectId: import.meta.env.VITE_DEFAULT_PROJECT_ID,
  workspaceName: import.meta.env.VITE_WORKSPACE_NAME,
  themeStorageKey: `${import.meta.env.VITE_DEFAULT_PROJECT_ID}.theme`,
  customCommandsStorageKey: `${import.meta.env.VITE_DEFAULT_PROJECT_ID}.custom-commands`,
  persistedRootsStorageKey: `${import.meta.env.VITE_DEFAULT_PROJECT_ID}.persistedRoots`,
}
