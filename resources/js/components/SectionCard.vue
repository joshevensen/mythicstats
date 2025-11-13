<template>
  <Card class="w-full shadow-1">
    <template #title>
      <div class="flex items-center justify-between gap-3">
        <div class="flex flex-col gap-1">
          <span class="text-lg font-semibold text-color">{{ title }}</span>
          <small v-if="subtitle" class="text-600">{{ subtitle }}</small>
        </div>
        <div class="flex items-center gap-2">
          <slot name="actions" />
        </div>
      </div>
    </template>
    <template #content>
      <slot />
    </template>
  </Card>
</template>

<script setup lang="ts">
import Card from 'primevue/card'

defineProps<{
  title: string
  subtitle?: string
}>()
</script>
