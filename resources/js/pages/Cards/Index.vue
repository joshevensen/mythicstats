<template>
  <AppLayout>
    <PageHeader :title="set.name + ' · Cards'" :subtitle="setSubtitle">
      <template #actions>
        <form class="flex gap-2" @submit.prevent="submit">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="form.search" placeholder="Search by name or number" class="w-72" />
          </span>
          <Button label="Search" icon="pi pi-search" type="submit" />
          <Button
            v-if="form.search"
            type="button"
            label="Reset"
            icon="pi pi-times"
            severity="secondary"
            outlined
            @click="reset"
          />
        </form>
      </template>
    </PageHeader>

    <SectionCard title="Card List" :subtitle="`${cards.length} results`">
      <DataTable
        :value="cards"
        dataKey="id"
        paginator
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
        responsiveLayout="scroll"
      >
        <Column field="name" header="Name" sortable />
        <Column field="number" header="Number" sortable />
        <Column field="rarity" header="Rarity" sortable />
        <Column header="Inventory">
          <template #body="{ data }">
            <Tag
              :severity="data.inInventory ? 'success' : 'secondary'"
              :value="data.inInventory ? 'In inventory' : 'Not tracked'"
              rounded
            />
          </template>
        </Column>
        <Column header="Actions" bodyClass="text-right">
          <template #body="{ data }">
            <Button
              label="View"
              icon="pi pi-eye"
              size="small"
              @click="navigate(`/cards/${data.id}`)"
            />
          </template>
        </Column>
      </DataTable>
    </SectionCard>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { router, useForm } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'

interface SetDetail {
  id: number
  name: string
  slug: string | null
  releaseDate: string | null
  game: { id: number; name: string } | null
}

interface CardRow {
  id: number
  name: string
  number: string | null
  rarity: string | null
  inInventory: boolean
}

const props = defineProps<{
  set: SetDetail
  cards: CardRow[]
  filters: {
    search: string
  }
}>()

const set = computed(() => props.set)
const cards = computed(() => props.cards)

const form = useForm({
  search: props.filters.search ?? '',
})

const setSubtitle = computed(() => {
  if (!set.value.game) return 'Standalone set'
  return `${set.value.game.name} · ${set.value.releaseDate ?? 'unknown release'}`
})

function submit() {
  router.get(`/sets/${set.value.id}/cards`, form.data(), {
    replace: true,
    preserveState: true,
    preserveScroll: true,
  })
}

function reset() {
  form.search = ''
  submit()
}

function navigate(url: string) {
  router.visit(url)
}
</script>
