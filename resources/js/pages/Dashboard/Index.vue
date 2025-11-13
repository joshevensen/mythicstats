<template>
  <AppLayout>
    <PageHeader title="Dashboard" subtitle="Stay on top of tracking status and API usage.">
      <template #actions>
        <Button
          label="Manage Inventory"
          icon="pi pi-inbox"
          severity="primary"
          @click="navigate('/inventory')"
        />
      </template>
    </PageHeader>

    <div class="grid gap-6 md:grid-cols-3">
      <StatCard
        label="Tracked Cards"
        :value="inventorySummary.totalCards"
        icon="pi pi-clone"
        format="number"
        helper="Unique cards tracked"
      />
      <StatCard
        label="Total Quantity"
        :value="inventorySummary.totalQuantity"
        icon="pi pi-box"
        format="number"
        helper="Across all variants"
      />
      <StatCard
        label="Estimated Value"
        :value="inventorySummary.totalValue"
        icon="pi pi-dollar"
        format="currency"
        helper="Based on latest prices"
      />
    </div>

    <div class="mt-8 grid gap-6 xl:grid-cols-2">
      <div>
        <SectionCard title="API Rate Limit" subtitle="Usage at a glance">
          <div class="flex flex-col gap-4">
            <div class="flex items-center gap-3">
              <i class="pi pi-shield text-2xl text-primary-400"></i>
              <div>
                <p class="text-lg font-semibold text-color">
                  Plan: {{ apiStatus.plan ?? 'Unknown' }}
                </p>
                <small class="text-600"> Next reset {{ resetTimeRelative }} </small>
              </div>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <h4 class="text-md text-600 mb-2">Monthly Usage</h4>
                <ProgressBar :value="monthlyUsagePercentage" show-value />
                <small class="text-600">
                  {{ apiStatus.monthly.used ?? 0 }} of {{ apiStatus.monthly.limit ?? '∞' }} requests
                  used
                </small>
              </div>
              <div>
                <h4 class="text-md text-600 mb-2">Daily Usage</h4>
                <ProgressBar :value="dailyUsagePercentage" show-value />
                <small class="text-600">
                  {{ apiStatus.daily.used ?? 0 }} of {{ apiStatus.daily.limit ?? '∞' }} requests
                  used
                </small>
              </div>
            </div>
            <Tag
              :severity="apiStatus.canMakeRequest ? 'success' : 'danger'"
              :value="apiStatus.canMakeRequest ? 'API available' : 'Rate limited'"
            />
          </div>
        </SectionCard>
      </div>

      <div>
        <SectionCard title="Recent Price Updates" subtitle="Latest variant refreshes">
          <DataTable :value="recentActivity.priceUpdates" size="small" dataKey="id">
            <Column header="Card">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-medium text-color">
                    {{ data.inventoryItem?.card?.name ?? 'Unknown card' }}
                  </span>
                  <small class="text-600">
                    {{ data.inventoryItem?.card?.set?.name ?? 'No set' }}
                  </small>
                </div>
              </template>
            </Column>
            <Column field="price" header="Price" bodyClass="text-nowrap">
              <template #body="{ data }">
                {{ formatCurrency(data.price ?? 0) }}
              </template>
            </Column>
            <Column header="Condition">
              <template #body="{ data }">
                <Tag v-if="data.condition" severity="info" :value="data.condition" />
              </template>
            </Column>
            <Column header="Updated">
              <template #body="{ data }">
                <span>{{ formatRelative(data.lastPriceUpdateAt) }}</span>
              </template>
            </Column>
          </DataTable>
        </SectionCard>
      </div>
    </div>

    <div class="mt-8">
      <SectionCard title="Recent Set Syncs" subtitle="Latest automated sync jobs">
        <DataTable :value="recentActivity.syncs" size="small" dataKey="id">
          <Column header="Set">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-medium text-color">
                  {{ data.set?.name ?? 'Unknown set' }}
                </span>
                <small class="text-600">
                  {{ data.set?.game?.name ?? 'Unknown game' }}
                </small>
              </div>
            </template>
          </Column>
          <Column header="Release Date">
            <template #body="{ data }">
              {{ data.set?.releaseDate ?? 'N/A' }}
            </template>
          </Column>
          <Column header="Last Sync">
            <template #body="{ data }">
              <TrackedStatus :active="true" :timestamp="data.lastSyncAt" type="sync" />
            </template>
          </Column>
        </DataTable>
      </SectionCard>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import StatCard from '@/components/StatCard.vue'
import SectionCard from '@/components/SectionCard.vue'
import TrackedStatus from '@/components/TrackedStatus.vue'

interface ApiStatus {
  plan?: string | null
  canMakeRequest: boolean
  resetTime?: string | null
  monthly: { used?: number | null; limit?: number | null }
  daily: { used?: number | null; limit?: number | null }
}

interface DashboardProps {
  inventorySummary: {
    totalCards: number
    totalQuantity: number
    totalValue: number
  }
  apiStatus: ApiStatus
  recentActivity: {
    syncs: Array<{
      id: number
      lastSyncAt: string | null
      set: {
        id: number
        name: string
        releaseDate: string | null
        game: { id: number; name: string } | null
      } | null
    }>
    priceUpdates: Array<{
      id: number
      lastPriceUpdateAt: string | null
      price: number | null
      condition: string | null
      inventoryItem: {
        id: number
        card: { id: number; name: string; set?: { id: number; name: string } | null } | null
      } | null
    }>
  }
}

const props = defineProps<DashboardProps>()

const inventorySummary = computed(() => props.inventorySummary)
const apiStatus = computed(() => props.apiStatus)
const recentActivity = computed(() => props.recentActivity)

const monthlyUsagePercentage = computed(() => {
  const used = apiStatus.value.monthly.used ?? 0
  const limit = apiStatus.value.monthly.limit ?? 0
  if (!limit) return 0
  return Math.min(100, Math.round((used / limit) * 100))
})

const dailyUsagePercentage = computed(() => {
  const used = apiStatus.value.daily.used ?? 0
  const limit = apiStatus.value.daily.limit ?? 0
  if (!limit) return 0
  return Math.min(100, Math.round((used / limit) * 100))
})

const resetTimeRelative = computed(() => formatRelative(apiStatus.value.resetTime))

function formatRelative(timestamp?: string | null) {
  if (!timestamp) return 'unknown'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) {
    return 'unknown'
  }
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = date.getTime() - Date.now()
  const minutes = Math.round(diff / 60000)
  if (Math.abs(minutes) < 60) {
    return formatter.format(Math.round(minutes), 'minutes')
  }
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) {
    return formatter.format(hours, 'hours')
  }
  const days = Math.round(hours / 24)
  return formatter.format(days, 'days')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

function navigate(path: string) {
  router.visit(path)
}
</script>
