<template>
  <AppLayout>
    <PageHeader :title="game.name" subtitle="Manage tracked sets and manual discovery.">
      <template #actions>
        <div class="flex gap-2">
          <Button
            icon="pi pi-search"
            label="Discover Sets"
            severity="help"
            outlined
            @click="discoverSets"
            v-if="trackedGame"
          />
          <Button
            :label="trackedGame?.isActive ? 'Pause Tracking' : 'Resume Tracking'"
            :icon="trackedGame?.isActive ? 'pi pi-pause' : 'pi pi-play'"
            severity="secondary"
            outlined
            @click="toggleGame"
            v-if="trackedGame"
          />
          <Button
            label="Untrack Game"
            icon="pi pi-times"
            severity="danger"
            outlined
            @click="untrackGame"
            v-if="trackedGame"
          />
          <Button
            label="Track Game"
            icon="pi pi-plus"
            severity="primary"
            @click="trackGame"
            v-else
          />
        </div>
      </template>
    </PageHeader>

    <div class="mb-6">
      <Card class="shadow-1">
        <template #content>
          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <span class="text-sm text-600 block">Cards</span>
              <span class="text-2xl font-semibold">
                {{ game.cardsCount ?? 0 }}
              </span>
            </div>
            <div>
              <span class="text-sm text-600 block">Sets</span>
              <span class="text-2xl font-semibold">
                {{ game.setsCount ?? 0 }}
              </span>
            </div>
            <div>
              <span class="text-sm text-600 block">Tracking Status</span>
              <TrackedStatus
                :active="trackedGame?.isActive ?? false"
                :timestamp="trackedGame?.lastSetsDiscoveryAt ?? null"
                type="discovery"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <SectionCard title="Sets" subtitle="Toggle tracking and trigger manual syncs">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <span class="p-input-icon-left">
          <i class="pi pi-search"></i>
          <InputText v-model="searchTerm" placeholder="Search sets" class="w-60" />
        </span>
        <Tag severity="info" :value="`${filteredSets.length} sets`" />
      </div>

      <DataTable
        :value="filteredSets"
        dataKey="id"
        :sortField="'releaseDate'"
        :sortOrder="-1"
        paginator
        :rows="15"
        responsiveLayout="scroll"
      >
        <Column field="name" header="Set" sortable />
        <Column header="Release Date" sortable>
          <template #body="{ data }">
            {{ data.releaseDate ?? 'Unknown' }}
          </template>
        </Column>
        <Column header="Tracking">
          <template #body="{ data }">
            <TrackedStatus
              :active="data.isTracked && data.trackedSet?.isActive"
              :timestamp="data.trackedSet?.lastSyncAt"
              type="sync"
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
                @click="trackSet(data.id)"
              />
              <Button
                v-else
                label="Untrack"
                icon="pi pi-times"
                size="small"
                severity="danger"
                outlined
                @click="untrackSet(data.id)"
              />
              <Button
                v-if="data.isTracked"
                :label="data.trackedSet?.isActive ? 'Pause' : 'Resume'"
                icon="pi pi-refresh"
                size="small"
                severity="secondary"
                outlined
                @click="toggleSet(data.id)"
              />
              <Button
                v-if="data.isTracked"
                icon="pi pi-sync"
                size="small"
                severity="help"
                outlined
                v-tooltip.top="'Sync cards now'"
                @click="syncSet(data.id)"
              />
              <Button
                label="View"
                icon="pi pi-eye"
                size="small"
                @click="navigate(`/sets/${data.id}`)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </SectionCard>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import TrackedStatus from '@/components/TrackedStatus.vue'

interface TrackedGame {
  id: number
  isActive: boolean
  lastSetsDiscoveryAt: string | null
}

interface TrackedSet {
  id: number
  isActive: boolean
  lastSyncAt: string | null
}

interface Game {
  id: number
  name: string
  slug: string | null
  cardsCount: number | null
  setsCount: number | null
}

interface SetRow {
  id: number
  name: string
  slug: string | null
  releaseDate: string | null
  cardsCount: number | null
  isTracked: boolean
  trackedSet: TrackedSet | null
}

const props = defineProps<{
  game: Game
  sets: SetRow[]
  trackedGame: TrackedGame | null
}>()

const searchTerm = ref('')

const filteredSets = computed(() => {
  if (!searchTerm.value) return props.sets
  const term = searchTerm.value.toLowerCase()
  return props.sets.filter((set) => set.name.toLowerCase().includes(term))
})

const game = computed(() => props.game)
const trackedGame = computed(() => props.trackedGame)

function navigate(url: string) {
  router.visit(url)
}

function trackGame() {
  router.post(`/games/${game.value.id}/track`, undefined, { preserveScroll: true })
}

function untrackGame() {
  router.delete(`/games/${game.value.id}/track`, { preserveScroll: true })
}

function toggleGame() {
  router.patch(`/games/${game.value.id}/track`, undefined, { preserveScroll: true })
}

function discoverSets() {
  router.post(`/games/${game.value.id}/discover-sets`, undefined, { preserveScroll: true })
}

function trackSet(setId: number) {
  router.post(`/sets/${setId}/track`, undefined, { preserveScroll: true })
}

function untrackSet(setId: number) {
  router.delete(`/sets/${setId}/track`, { preserveScroll: true })
}

function toggleSet(setId: number) {
  router.patch(`/sets/${setId}/track`, undefined, { preserveScroll: true })
}

function syncSet(setId: number) {
  router.post(`/sets/${setId}/sync`, undefined, { preserveScroll: true })
}
</script>
