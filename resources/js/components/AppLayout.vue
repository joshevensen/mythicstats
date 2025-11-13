<template>
  <div class="min-h-screen flex flex-col">
    <Menubar :model="menuItems" class="surface-section border-0 shadow-1 px-3 py-2">
      <template #start>
        <div class="flex items-center gap-2 cursor-pointer" @click="navigate('/')">
          <i class="pi pi-chart-line text-primary text-xl"></i>
          <span class="text-lg font-bold text-color">MythicStats</span>
        </div>
      </template>
      <template #end>
        <div class="flex items-center gap-3">
          <span class="text-sm text-600" v-if="user">
            {{ user.fullName ?? user.email }}
          </span>
          <Button label="Logout" size="small" severity="secondary" outlined @click="logout" />
        </div>
      </template>
    </Menubar>

    <FlashMessages />

    <main class="flex-1 p-4 md:p-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { router, usePage } from '@inertiajs/vue3'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import FlashMessages from '@/components/FlashMessages.vue'

interface SharedProps {
  auth: {
    id: number
    email: string
    fullName?: string | null
  } | null
}

const page = usePage<SharedProps>()
const user = computed(() => page.props.auth)

const menuItems = computed(() => [
  {
    label: 'Dashboard',
    icon: 'pi pi-home',
    command: () => navigate('/'),
  },
  {
    label: 'Games',
    icon: 'pi pi-sparkles',
    command: () => navigate('/games'),
  },
  {
    label: 'Inventory',
    icon: 'pi pi-inbox',
    command: () => navigate('/inventory'),
  },
])

function navigate(url: string) {
  router.visit(url)
}

function logout() {
  router.post('/logout', undefined, {
    preserveScroll: true,
  })
}
</script>

<style scoped>
.p-menubar {
  border-radius: 0;
}
</style>
