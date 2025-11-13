<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <header class="flex flex-col gap-2 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-3">
      <div class="flex flex-col gap-1">
        <h1 class="text-3xl font-semibold text-color">{{ title }}</h1>
        <p v-if="subtitle" class="text-600">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </header>
</template>
