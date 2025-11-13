<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { usePage } from '@inertiajs/vue3'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

interface FlashProps {
  flash?: {
    success?: string | null
    error?: string | null
    warning?: string | null
  }
}

const page = usePage() as { props: FlashProps }
const toast = useToast()

const flash = computed(() => page.props.flash ?? {})

function showMessages() {
  if (flash.value.success) {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: flash.value.success,
      life: 4000,
    })
  }

  if (flash.value.error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: flash.value.error,
      life: 6000,
    })
  }

  if (flash.value.warning) {
    toast.add({
      severity: 'warn',
      summary: 'Notice',
      detail: flash.value.warning,
      life: 5000,
    })
  }
}

onMounted(showMessages)

watch(flash, () => {
  showMessages()
})
</script>

<template>
  <Toast position="top-right" />
</template>
