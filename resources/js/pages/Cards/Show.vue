<template>
  <AppLayout>
    <PageHeader :title="card.name" :subtitle="cardSubtitle">
      <template #actions>
        <Button
          label="Back to Set"
          icon="pi pi-arrow-left"
          severity="secondary"
          @click="navigate(`/sets/${card.set?.id}/cards`)"
        />
      </template>
    </PageHeader>

    <div class="grid gap-6 lg:grid-cols-3">
      <div class="flex flex-col gap-6 lg:col-span-1">
        <SectionCard title="Card Details">
          <form class="flex flex-col gap-3" @submit.prevent="submitCard">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-600">Name</label>
              <InputText v-model="cardForm.name" required />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-600">Number</label>
              <InputText v-model="cardForm.number" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-600">Rarity</label>
              <InputText v-model="cardForm.rarity" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-600">Details (JSON)</label>
              <Textarea v-model="cardForm.details" rows="4" auto-resize />
            </div>
            <div class="flex justify-end">
              <Button type="submit" label="Save" icon="pi pi-save" :loading="cardForm.processing" />
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Inventory Snapshot" subtitle="Latest quantities and price updates">
          <div v-if="inventoryItem" class="flex flex-col gap-3">
            <div class="flex flex-col gap-1">
              <span class="text-sm text-600">Notes</span>
              <span>{{ inventoryItem.notes ?? '—' }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm text-600">Variants</span>
              <ul class="list-none m-0 p-0 flex flex-col gap-2">
                <li
                  v-for="variant in inventoryItem.variants"
                  :key="variant.id"
                  class="surface-100 rounded-md p-3"
                >
                  <div class="flex justify-between">
                    <span class="font-medium">
                      {{ variant.details?.condition ?? 'Unknown' }}
                    </span>
                    <span class="text-sm text-600"> Qty: {{ variant.quantity }} </span>
                  </div>
                  <small class="block text-600">
                    Last price update: {{ formatRelative(variant.lastPriceUpdateAt) }}
                  </small>
                </li>
              </ul>
            </div>
          </div>
          <Message
            v-else
            severity="info"
            icon="pi pi-info-circle"
            text="This card is not yet in your inventory."
          />
        </SectionCard>
      </div>

      <div class="lg:col-span-2">
        <SectionCard title="Variants" subtitle="Update pricing and metadata">
          <Table :value="variantRows" dataKey="id">
            <Column field="condition" header="Condition" />
            <Column field="printing" header="Printing" />
            <Column field="language" header="Language" />
            <Column header="Price">
              <template #body="{ data }">
                <InputNumber
                  v-model="variantEdits[data.id].price"
                  mode="currency"
                  currency="USD"
                  locale="en-US"
                  :minFractionDigits="2"
                />
              </template>
            </Column>
            <Column header="Actions" bodyClass="text-right">
              <template #body="{ data }">
                <Button
                  label="Save"
                  icon="pi pi-save"
                  size="small"
                  :loading="variantEdits[data.id].processing"
                  @click="updateVariant(data.id)"
                />
              </template>
            </Column>
          </Table>
        </SectionCard>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Textarea from 'primevue/textarea'
import { useToast } from 'primevue/usetoast'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import Table from '@/components/Table.vue'

interface Variant {
  id: number
  condition: string
  printing: string | null
  language: string | null
  price: number
  currency: string
  lastUpdated: number | null
  priceChange7d: number | null
}

interface CardDetail {
  id: number
  name: string
  number: string | null
  rarity: string | null
  details: Record<string, unknown> | null
  set: {
    id: number
    name: string
    slug: string | null
    game: { id: number; name: string } | null
  } | null
  variants: Variant[]
}

interface InventoryVariant {
  id: number
  quantity: number
  lastPriceUpdateAt: string | null
  details: {
    id: number
    condition: string
    printing: string | null
    language: string | null
    price: number | null
  } | null
}

interface InventoryItem {
  id: number
  notes: string | null
  variants: InventoryVariant[]
}

const props = defineProps<{
  card: CardDetail
  inventoryItem: InventoryItem | null
}>()

const card = computed(() => props.card)
const inventoryItem = computed(() => props.inventoryItem)

const cardSubtitle = computed(() => {
  const setName = card.value.set?.name ?? 'Unknown set'
  const gameName = card.value.set?.game?.name ?? 'Unknown game'
  return `${setName} · ${gameName}`
})

const cardForm = useForm({
  name: card.value.name,
  number: card.value.number ?? '',
  rarity: card.value.rarity ?? '',
  details: card.value.details ? JSON.stringify(card.value.details, null, 2) : '',
})

const variantRows = computed(() => card.value.variants)

const variantEdits = reactive<Record<number, { price: number; processing: boolean }>>(
  card.value.variants.reduce(
    (acc, variant) => {
      acc[variant.id] = {
        price: variant.price,
        processing: false,
      }
      return acc
    },
    {} as Record<number, { price: number; processing: boolean }>
  )
)

const toast = useToast()

function submitCard() {
  let detailsPayload: unknown = null
  if (cardForm.details) {
    try {
      detailsPayload = JSON.parse(cardForm.details)
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Invalid JSON',
        detail: 'Details must be valid JSON',
        life: 5000,
      })
      return
    }
  }

  cardForm
    .transform((data: typeof cardForm.data) => ({
      ...data,
      details: detailsPayload,
    }))
    .patch(`/cards/${card.value.id}`, {
      preserveScroll: true,
    })
}

function updateVariant(variantId: number) {
  const state = variantEdits[variantId]
  state.processing = true
  router.patch(
    `/cards/variants/${variantId}`,
    {
      price: state.price,
    },
    {
      preserveScroll: true,
      onFinish: () => {
        state.processing = false
      },
    }
  )
}

function navigate(url: string) {
  router.visit(url)
}

function formatRelative(timestamp: string | null) {
  if (!timestamp) return 'never'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'unknown'
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (Math.abs(minutes) < 60) {
    return formatter.format(-minutes, 'minutes')
  }
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) {
    return formatter.format(-hours, 'hours')
  }
  const days = Math.round(hours / 24)
  return formatter.format(-days, 'days')
}
</script>
