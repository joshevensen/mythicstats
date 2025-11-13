<template>
  <DataTable v-bind="mergedAttrs">
    <slot />
  </DataTable>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import DataTable from 'primevue/datatable'

defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const mergedAttrs = computed(() => ({
  stripedRows: true,
  showGridlines: false,
  ...attrs,
}))
</script>

