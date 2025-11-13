<template>
  <AppLayout>
    <PageHeader title="Inventory" subtitle="Track owned cards, quantities, and live market prices.">
      <template #actions>
        <Button
          label="Update Prices"
          icon="pi pi-sync"
          severity="help"
          outlined
          @click="updatePrices"
        />
      </template>
    </PageHeader>

    <SectionCard title="Inventory Items" :subtitle="`${inventoryItems.length} tracked cards`">
      <DataTable
        :value="inventoryItems"
        dataKey="id"
        paginator
        :rows="20"
        :rowsPerPageOptions="[20, 50, 100]"
        responsiveLayout="scroll"
      >
        <Column header="Card">
          <template #body="{ data }">
            <div class="flex flex-col">
              <span class="font-semibold text-color">{{ data.card?.name ?? 'Unknown card' }}</span>
              <small class="text-600">
                {{ data.card?.set?.name ?? 'Unknown set' }}
              </small>
            </div>
          </template>
        </Column>
        <Column header="Quantity" field="totalQuantity" sortable />
        <Column header="Value" sortable>
          <template #body="{ data }">
            {{ formatCurrency(data.totalValue) }}
          </template>
        </Column>
        <Column header="Last Price Update">
          <template #body="{ data }">
            <TrackedStatus :active="true" :timestamp="data.lastPriceUpdateAt" type="price" />
          </template>
        </Column>
        <Column header="Actions" bodyClass="text-right">
          <template #body="{ data }">
            <Button
              label="Details"
              icon="pi pi-eye"
              size="small"
              @click="navigate(`/inventory/${data.id}`)"
            />
          </template>
        </Column>
      </DataTable>
    </SectionCard>
  </AppLayout>
</template>

<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import TrackedStatus from '@/components/TrackedStatus.vue'

interface InventoryItemRow {
  id: number
  notes: string | null
  totalQuantity: number
  totalValue: number
  lastPriceUpdateAt: string | null
  card: {
    id: number
    name: string
    number: string | null
    set: { id: number; name: string } | null
  } | null
}

const props = defineProps<{
  inventoryItems: InventoryItemRow[]
}>()

const inventoryItems = props.inventoryItems

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function navigate(url: string) {
  router.visit(url)
}

function updatePrices() {
  router.post('/inventory/update-prices', undefined, {
    preserveScroll: true,
  })
}
</script>
