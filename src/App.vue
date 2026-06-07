<script setup lang="ts">
import { ref } from 'vue'

import AppShell from '@/components/layout/AppShell.vue'
import GlobalToast from '@/components/GlobalToast.vue'
import ReleaseNotesModal from '@/components/ReleaseNotesModal.vue'
import SoftwareUpdateModal from '@/components/SoftwareUpdateModal.vue'
import StartupSplash from '@/components/StartupSplash.vue'

const startupDone = ref(false)
</script>

<template>
  <AppShell />
  <GlobalToast />
  <ReleaseNotesModal v-if="startupDone" />
  <SoftwareUpdateModal v-if="startupDone" />
  <StartupSplash v-if="!startupDone" @done="startupDone = true" />
</template>
