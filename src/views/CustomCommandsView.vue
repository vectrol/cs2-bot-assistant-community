<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useCustomCommandsStore } from '@/stores/custom-commands'
import type { CustomCommandItem } from '@/types/custom-command'

const store = useCustomCommandsStore()

const editingId = ref('')
const copiedCommandId = ref('')
const localMessage = ref('')
const form = reactive({
  title: '',
  description: '',
  command: '',
})

let copiedTimer: ReturnType<typeof setTimeout> | null = null

const isEditing = computed(() => editingId.value.length > 0)
const hasItems = computed(() => store.items.length > 0)

function resetForm() {
  editingId.value = ''
  form.title = ''
  form.description = ''
  form.command = ''
}

function editCommand(item: CustomCommandItem) {
  editingId.value = item.id
  form.title = item.title
  form.description = item.description
  form.command = item.command
}

async function submit() {
  const trimmedCommand = form.command.trim()
  if (!trimmedCommand) {
    return
  }

  const draft = {
    title: form.title,
    description: form.description,
    command: trimmedCommand,
  }

  try {
    if (editingId.value) {
      await store.updateCommand(editingId.value, draft)
    } else {
      await store.addCommand(draft)
    }
    localMessage.value = store.storagePath ? `已保存到本地：${store.storagePath}` : '已保存到本地。'
    resetForm()
  } catch (error) {
    localMessage.value = normalizeError(error)
  }
}

function copyCommand(command: string, id: string) {
  const trimmed = command.trim()
  const normalized = trimmed.endsWith(';') ? trimmed : `${trimmed};`
  navigator.clipboard.writeText(normalized)
  copiedCommandId.value = id
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
  copiedTimer = setTimeout(() => {
    copiedCommandId.value = ''
    copiedTimer = null
  }, 1000)
}

async function deleteCommand(id: string) {
  try {
    await store.deleteCommand(id)
    localMessage.value = store.storagePath ? `已从本地文件删除：${store.storagePath}` : '已删除。'
  } catch (error) {
    localMessage.value = normalizeError(error)
  }
}

function normalizeError(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return '保存本地指令失败，请稍后重试。'
}

resetForm()

onMounted(async () => {
  try {
    await store.initialize()
    if (store.storagePath) {
      localMessage.value = `本地保存位置：${store.storagePath}`
    }
  } catch (error) {
    localMessage.value = normalizeError(error)
  }
})

onBeforeRouteLeave(() => {
  resetForm()
})

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="hero-banner">
      <div>
        <p class="eyebrow">我的指令</p>
        <h2>把常用命令保存下来，下次不用重新找。</h2>
        <p class="muted">可以给命令起名字、写备注，也可以只保存命令本身。</p>
      </div>
      <div class="hero-status">
        <span class="status-badge" :data-state="hasItems ? 'ready' : 'warn'">
          {{ store.busy ? '正在读取本地指令' : hasItems ? `已保存 ${store.items.length} 条命令` : '还没有保存任何命令' }}
        </span>
      </div>
    </article>

    <div class="custom-commands-layout">
      <article class="card custom-commands-list-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">已保存的命令</p>
            <h3>{{ hasItems ? '你的常用列表' : '列表还是空的' }}</h3>
          </div>
        </div>

        <div v-if="!hasItems" class="empty-state">
          <strong>还没有保存的命令</strong>
          <p class="muted">可以在右侧直接新建一条，保存后这里就会显示出来。</p>
        </div>

        <div v-else class="command-list">
          <article v-for="item in store.items" :key="item.id" class="custom-command-card">
            <div class="custom-command-head">
              <div>
                <strong>{{ item.title || '未命名命令' }}</strong>
                <p v-if="item.description" class="muted">{{ item.description }}</p>
              </div>
              <div class="actions-row">
                <button class="ghost-button" @click="copyCommand(item.command, item.id)">
                  {{ copiedCommandId === item.id ? '已复制' : '复制' }}
                </button>
                <button class="ghost-button" @click="editCommand(item)">编辑</button>
                <button class="ghost-button danger-button" :disabled="store.busy" @click="deleteCommand(item.id)">删除</button>
              </div>
            </div>

            <pre class="command-preview"><code>{{ item.command }}</code></pre>
          </article>
        </div>
      </article>

      <aside class="card custom-commands-editor-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">{{ isEditing ? '编辑命令' : '新建命令' }}</p>
            <h3>{{ isEditing ? '修改这条命令' : '保存一条新的常用命令' }}</h3>
          </div>
          <button
            v-if="isEditing || form.title || form.description || form.command"
            class="ghost-button"
            @click="resetForm"
          >
            清空
          </button>
        </div>

        <div class="custom-command-helper">
          <strong>建议用法</strong>
          <p class="muted">可以先去“常用指令”页复制一条命令，再回到这里粘贴并补充名称或备注。</p>
        </div>

        <div class="form-grid compact-form-grid">
          <label class="field">
            <span>名称</span>
            <input v-model="form.title" type="text" placeholder="可留空，例如：热身 Bot" />
          </label>

          <label class="field">
            <span>备注</span>
            <textarea
              v-model="form.description"
              rows="2"
              placeholder="可留空，例如：训练前快速重开对局"
            />
          </label>

          <label class="field">
            <span>命令内容</span>
            <textarea
              v-model="form.command"
              rows="8"
              placeholder="必填，例如：bot_kick; bot_add_ct; mp_restartgame 1"
            />
          </label>

          <button class="primary-button wide" :disabled="!form.command.trim() || store.busy" @click="submit">
            {{ isEditing ? '保存修改' : '保存命令' }}
          </button>
        </div>
      </aside>
    </div>

    <p v-if="localMessage" class="message-line">{{ localMessage }}</p>
  </section>
</template>
