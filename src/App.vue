<script setup lang="ts">
import { ref } from 'vue'

import AppShell from '@/components/layout/AppShell.vue'
import GlobalToast from '@/components/GlobalToast.vue'
import SoftwareUpdateModal from '@/components/SoftwareUpdateModal.vue'
import StartupSplash from '@/components/StartupSplash.vue'
import StartupAutomation from '@/components/StartupAutomation.vue'

const startupDone = ref(false)
</script>

<template>
  <AppShell />
  <GlobalToast />
  <SoftwareUpdateModal v-if="startupDone" />
  <StartupAutomation v-if="startupDone" />
  <StartupSplash v-if="!startupDone" @done="startupDone = true" />
</template>
