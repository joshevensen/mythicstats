<template>
  <AppLayout>
    <PageHeader :title="set.name" :subtitle="setSubtitle">
      <template #actions>
        <div class="flex gap-2">
          <Button
            label="View Cards"
            icon="pi pi-list"
            severity="secondary"
            @click="navigate(`/sets/${set.id}/cards`)"
          />
          <Button
            v-if="trackedSet"
            :label="trackedSet.isActive ? 'Pause Tracking' : 'Resume Tracking'"
            :icon="trackedSet.isActive ? 'pi pi-pause' : 'pi pi-play'"
            severity="secondary"
            outlined
            @click="toggleTracking"
          />
          <Button
            v-if="trackedSet"
            label="Sync Now"
            icon="pi pi-sync"
            severity="help"
            outlined
            @click="syncSet"
          />
          <Button
            v-if="trackedSet"
            label="Untrack"
            icon="pi pi-times"
            severity="danger"
            outlined
            @click="untrackSet"
          />
          <Button v-else label="Track Set" icon="pi pi-plus" severity="primary" @click="trackSet" />
        </div>
      </template>
    </PageHeader>

    <div class="grid gap-6 md:grid-cols-3 mb-6">
      <StatCard label="Total Cards" :value="cardSummary.total" icon="pi pi-clone" format="number" />
      <StatCard
        label="In Inventory"
        :value="cardSummary.inInventory"
        icon="pi pi-inbox"
        format="number"
      />
      <StatCard label="Price Range" :value="priceRangeText" icon="pi pi-chart-line" />
    </div>

    <Card class="shadow-1">
      <template #title>
        <div class="flex items-center justify-between">
          <span>Tracking Status</span>
          <Tag
            :severity="trackedSet?.isActive ? 'success' : 'secondary'"
            :value="trackedSetStatus"
          />
        </div>
      </template>
      <template #content>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-sm text-600">Game</span>
            <span class="text-lg font-semibold text-color">
              {{ set.game?.name ?? 'Unknown' }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm text-600">Release Date</span>
            <span class="text-lg font-semibold text-color">
              {{ set.releaseDate ?? 'Unknown' }}
            </span>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm text-600">Last Sync</span>
            <TrackedStatus
              :active="trackedSet?.isActive ?? false"
              :timestamp="trackedSet?.lastSyncAt ?? null"
              type="sync"
            />
          </div>
        </div>
      </template>
    </Card>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import TrackedStatus from '@/components/TrackedStatus.vue'

interface GameLite {
  id: number
  name: string
}

interface SetDetail {
  id: number
  name: string
  slug: string | null
  releaseDate: string | null
  cardsCount: number | null
  game: GameLite | null
}

interface TrackedSet {
  id: number
  isActive: boolean
  lastSyncAt: string | null
}

interface CardSummary {
  total: number
  inInventory: number
  priceRange: {
    min: number
    max: number
  }
}

const props = defineProps<{
  set: SetDetail
  trackedSet: TrackedSet | null
  cardSummary: CardSummary
}>()

const set = computed(() => props.set)
const trackedSet = computed(() => props.trackedSet)
const cardSummary = computed(() => props.cardSummary)

const setSubtitle = computed(() => {
  if (!set.value.game) return 'Standalone set'
  return `${set.value.game.name} · ${set.value.releaseDate ?? 'unknown release'}`
})

const priceRangeText = computed(() => {
  const { min, max } = cardSummary.value.priceRange
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
})

const trackedSetStatus = computed(() => {
  if (!trackedSet.value) return 'Not tracked'
  return trackedSet.value.isActive ? 'Active' : 'Paused'
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function navigate(url: string) {
  router.visit(url)
}

function trackSet() {
  router.post(`/sets/${set.value.id}/track`, undefined, {
    preserveScroll: true,
  })
}

function untrackSet() {
  router.delete(`/sets/${set.value.id}/track`, {
    preserveScroll: true,
  })
}

function toggleTracking() {
  router.patch(`/sets/${set.value.id}/track`, undefined, {
    preserveScroll: true,
  })
}

function syncSet() {
  router.post(`/sets/${set.value.id}/sync`, undefined, {
    preserveScroll: true,
  })
}
</script>
