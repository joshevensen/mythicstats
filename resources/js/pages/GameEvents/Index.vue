<template>
  <AppLayout>
    <PageHeader
      :title="`${game.name} · Events`"
      subtitle="Track significant events that impact pricing and interest."
    >
      <template #actions>
        <Button
          label="Create Event"
          icon="pi pi-plus"
          severity="primary"
          @click="navigate(`/games/${game.id}/events/create`)"
        />
      </template>
    </PageHeader>

    <SectionCard title="Event Timeline" :subtitle="`${events.length} total events`">
      <DataTable :value="events" dataKey="id" paginator :rows="15" responsiveLayout="scroll">
        <Column field="title" header="Title" sortable />
        <Column field="eventType" header="Type" sortable>
          <template #body="{ data }">
            <Tag severity="info" :value="formatType(data.eventType)" />
          </template>
        </Column>
        <Column header="Dates" sortable>
          <template #body="{ data }">
            <div class="flex flex-col">
              <span>{{ data.startDate ?? 'TBD' }}</span>
              <small class="text-600" v-if="data.endDate"> Ends {{ data.endDate }} </small>
            </div>
          </template>
        </Column>
        <Column header="Pricing Impact">
          <template #body="{ data }">
            <Tag
              :severity="data.affectsPricing ? 'warn' : 'secondary'"
              :value="data.affectsPricing ? 'Impacts pricing' : 'Neutral'"
            />
          </template>
        </Column>
        <Column header="Actions" bodyClass="text-right">
          <template #body="{ data }">
            <div class="flex justify-end gap-2">
              <Button
                label="Edit"
                icon="pi pi-pencil"
                size="small"
                severity="secondary"
                outlined
                @click="navigate(`/games/${game.id}/events/${data.id}`)"
              />
              <Button
                label="Delete"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="destroy(data.id)"
              />
            </div>
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
import Tag from 'primevue/tag'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'

interface Game {
  id: number
  name: string
}

interface GameEvent {
  id: number
  title: string
  eventType: string
  startDate: string | null
  endDate: string | null
  affectsPricing: boolean
}

const props = defineProps<{
  game: Game
  events: GameEvent[]
  eventTypes: string[]
}>()

const game = props.game
const events = props.events

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function navigate(url: string) {
  router.visit(url)
}

function destroy(eventId: number) {
  if (!window.confirm('Delete this event?')) {
    return
  }
  router.delete(`/events/${eventId}`, {
    preserveScroll: true,
  })
}
</script>
