<script setup lang="ts">
import { computed, reactive } from 'vue'
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import Table from '@/components/Table.vue'

interface VariantDetail {
  id: number
  condition: string | null
  printing: string | null
  language: string | null
  price: number | null
}

interface InventoryVariant {
  id: number
  quantity: number
  lastPriceUpdateAt: string | null
  variant: VariantDetail | null
}

interface InventoryItem {
  id: number
  notes: string | null
  card: {
    id: number
    name: string
    number: string | null
    set: { id: number; name: string; game?: { id: number; name: string } | null } | null
  } | null
  variants: InventoryVariant[]
}

const props = defineProps<{
  inventoryItem: InventoryItem
  totalValue: number
}>()

const inventoryItem = props.inventoryItem

const cardTitle = computed(() => inventoryItem.card?.name ?? 'Unknown card')
const cardSubtitle = computed(() => {
  const setName = inventoryItem.card?.set?.name ?? 'Unknown set'
  const gameName = inventoryItem.card?.set?.game?.name ?? 'Unknown game'
  return `${setName} · ${gameName}`
})

const totalValue = computed(() => props.totalValue)
const totalQuantity = computed(() =>
  inventoryItem.variants.reduce((sum, variant) => sum + variant.quantity, 0)
)

const variantForms = reactive<
  Record<
    number,
    {
      quantity: number
      processing: boolean
    }
  >
>(
  inventoryItem.variants.reduce(
    (acc, variant) => {
      acc[variant.id] = {
        quantity: variant.quantity,
        processing: false,
      }
      return acc
    },
    {} as Record<number, { quantity: number; processing: boolean }>
  )
)

function updateQuantity(variantId: number) {
  const form = variantForms[variantId]
  form.processing = true
  router.patch(
    `/inventory/variants/${variantId}/quantity`,
    { quantity: form.quantity },
    {
      preserveScroll: true,
      onFinish: () => {
        form.processing = false
      },
    }
  )
}

function resync() {
  router.post(`/inventory/${inventoryItem.id}/resync`, undefined, {
    preserveScroll: true,
  })
}

function navigate(url: string) {
  router.visit(url)
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
</script>

<template>
  <AppLayout>
    <PageHeader :title="cardTitle" :subtitle="cardSubtitle">
      <template #actions>
        <div class="flex gap-2">
          <Button
            label="Resync Variants"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            @click="resync"
          />
          <Button
            label="Back to Inventory"
            icon="pi pi-arrow-left"
            severity="secondary"
            @click="navigate('/inventory')"
          />
        </div>
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-1">
        <SectionCard title="Summary">
          <div class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-sm text-600">Total Quantity</span>
              <span class="text-3xl font-semibold text-color">
                {{ totalQuantity }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm text-600">Estimated Value</span>
              <span class="text-2xl font-semibold text-color">
                {{ formatCurrency(totalValue) }}
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm text-600">Notes</span>
              <span>{{ inventoryItem.notes ?? '—' }}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div class="lg:col-span-2">
        <SectionCard title="Variants" subtitle="Update on-hand quantity">
          <Table :value="inventoryItem.variants" dataKey="id">
            <Column header="Variant">
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span class="font-semibold text-color">
                    {{ data.variant?.condition ?? 'Unknown' }}
                  </span>
                  <small class="text-600">
                    {{ data.variant?.printing ?? '—' }} · {{ data.variant?.language ?? '—' }}
                  </small>
                </div>
              </template>
            </Column>
            <Column header="Price">
              <template #body="{ data }">
                {{ formatCurrency(data.variant?.price ?? 0) }}
              </template>
            </Column>
            <Column header="Quantity">
              <template #body="{ data }">
                <InputNumber v-model="variantForms[data.id].quantity" :min="0" />
              </template>
            </Column>
            <Column header="Actions" bodyClass="text-right">
              <template #body="{ data }">
                <Button
                  label="Save"
                  icon="pi pi-save"
                  size="small"
                  :loading="variantForms[data.id].processing"
                  @click="updateQuantity(data.id)"
                />
              </template>
            </Column>
          </Table>
        </SectionCard>
      </div>
    </div>
  </AppLayout>
</template>
