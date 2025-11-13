<script setup lang="ts">
import { computed } from 'vue'
import Card from 'primevue/card'

const props = defineProps<{
  label: string
  value: number | string
  icon?: string
  helper?: string
  format?: 'number' | 'currency'
}>()

const formattedValue = computed(() => {
  if (props.format === 'currency' && typeof props.value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(props.value)
  }
  if (props.format === 'number' && typeof props.value === 'number') {
    return new Intl.NumberFormat('en-US').format(props.value)
  }
  return props.value
})
</script>

<template>
  <Card class="w-full p-4">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-600 text-sm font-medium">{{ label }}</span>
        <i v-if="icon" :class="['pi', icon, 'text-2xl text-primary-500']"></i>
      </div>
    </template>
    <template #content>
      <div class="flex flex-col gap-2 mt-3">
        <span class="text-4xl font-semibold text-color">{{ formattedValue }}</span>
        <small v-if="helper" class="text-600">{{ helper }}</small>
      </div>
    </template>
  </Card>
</template>
