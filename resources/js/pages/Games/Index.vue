<script setup lang="ts">
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import Table from '@/components/Table.vue'
import TrackedStatus from '@/components/TrackedStatus.vue'

interface TrackedGame {
  id: number
  isActive: boolean
  lastSetsDiscoveryAt: string | null
}

interface GameRow {
  id: number
  name: string
  slug: string | null
  cardsCount: number | null
  setsCount: number | null
  isTracked: boolean
  trackedGame: TrackedGame | null
}

const props = defineProps<{
  games: GameRow[]
}>()

const searchTerm = ref('')

const filteredGames = computed(() => {
  if (!searchTerm.value) {
    return props.games
  }
  const term = searchTerm.value.toLowerCase()
  return props.games.filter((game) => game.name.toLowerCase().includes(term))
})

function navigate(url: string) {
  router.visit(url)
}

function trackGame(gameId: number) {
  router.post(`/games/${gameId}/track`, undefined, { preserveScroll: true })
}

function untrackGame(gameId: number) {
  router.delete(`/games/${gameId}/track`, {
    preserveScroll: true,
  })
}

function toggleGame(gameId: number) {
  router.patch(`/games/${gameId}/track`, undefined, { preserveScroll: true })
}

function discoverSets(gameId: number) {
  router.post(`/games/${gameId}/discover-sets`, undefined, {
    preserveScroll: true,
  })
}

function refreshGames() {
  router.post('/games/pull', undefined, { preserveScroll: true })
}
</script>

<template>
  <AppLayout>
    <PageHeader title="Games" subtitle="Track games to discover sets and keep data in sync.">
      <template #actions>
        <div class="flex items-center gap-3">
          <Button
            label="Refresh from JustTCG"
            icon="pi pi-cloud-download"
            severity="secondary"
            outlined
            size="small"
            @click="refreshGames"
          />
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="searchTerm" placeholder="Search games" class="w-15rem" />
          </span>
        </div>
      </template>
    </PageHeader>

    <SectionCard title="Tracked Games" subtitle="Manage discovery cadence per game">
      <Table
        :value="filteredGames"
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10, 25, 50]"
      >
        <Column field="name" header="Game" sortable />
        <Column header="Cards / Sets" sortable>
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <Tag severity="secondary" :value="data.cardsCount ?? 0 + ' cards'" />
              <Tag severity="info" :value="data.setsCount ?? 0 + ' sets'" />
            </div>
          </template>
        </Column>
        <Column header="Tracking">
          <template #body="{ data }">
            <TrackedStatus
              :active="data.isTracked && data.trackedGame?.isActive"
              :timestamp="data.trackedGame?.lastSetsDiscoveryAt"
              type="discovery"
            />
          </template>
        </Column>
        <Column header="Actions" bodyClass="text-right">
          <template #body="{ data }">
            <div class="flex justify-end gap-2">
              <Button
                v-if="!data.isTracked"
                label="Track"
                icon="pi pi-plus"
                size="small"
                @click="trackGame(data.id)"
              />
              <Button
                v-else
                label="Untrack"
                icon="pi pi-times"
                size="small"
                severity="danger"
                outlined
                @click="untrackGame(data.id)"
              />
              <Button
                v-if="data.isTracked"
                :label="data.trackedGame?.isActive ? 'Pause' : 'Resume'"
                icon="pi pi-refresh"
                size="small"
                severity="secondary"
                outlined
                @click="toggleGame(data.id)"
              />
              <Button
                v-if="data.isTracked"
                icon="pi pi-search"
                size="small"
                severity="help"
                outlined
                v-tooltip.top="'Discover sets now'"
                @click="discoverSets(data.id)"
              />
              <Button
                label="View"
                icon="pi pi-eye"
                size="small"
                severity="secondary"
                @click="navigate(`/games/${data.id}`)"
              />
            </div>
          </template>
        </Column>
      </Table>
    </SectionCard>
  </AppLayout>
</template>
