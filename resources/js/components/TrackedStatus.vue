<template>
  <Tag :severity="statusSeverity" :value="statusLabel" rounded class="text-sm font-medium" />
  <small v-if="timestamp" class="block text-600 mt-1">
    {{ timestampLabel }} {{ relativeTime }}
  </small>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'

const props = defineProps<{
  active: boolean
  timestamp?: string | null
  type?: 'discovery' | 'sync' | 'price'
}>()

const statusSeverity = computed(() => (props.active ? 'success' : 'danger'))
const statusLabel = computed(() => (props.active ? 'Active' : 'Inactive'))

const timestampLabel = computed(() => {
  if (props.type === 'discovery') return 'Last discovery'
  if (props.type === 'price') return 'Last price update'
  return 'Last sync'
})

const relativeTime = computed(() => {
  if (!props.timestamp) return 'never'
  const date = new Date(props.timestamp)
  if (Number.isNaN(date.getTime())) return 'unknown'

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60000)

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(-diffMinutes, 'minutes')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(-diffHours, 'hours')
  }

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(-diffDays, 'days')
})
</script>
