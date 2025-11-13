<template>
  <AppLayout>
    <PageHeader
      :title="`Create Event · ${game.name}`"
      subtitle="Log upcoming releases, tournaments, or pricing catalysts."
    >
      <template #actions>
        <Button
          label="Back"
          icon="pi pi-arrow-left"
          severity="secondary"
          @click="navigate(`/games/${game.id}/events`)"
        />
      </template>
    </PageHeader>

    <SectionCard title="Event Details">
      <GameEventForm :game-id="game.id" :event-types="eventTypes" :submit-url="`/events`">
        <template #footer>
          <Button
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            type="button"
            outlined
            @click="navigate(`/games/${game.id}/events`)"
          />
        </template>
      </GameEventForm>
    </SectionCard>
  </AppLayout>
</template>

<script setup lang="ts">
import { router } from '@inertiajs/vue3'
import Button from 'primevue/button'

import AppLayout from '@/components/AppLayout.vue'
import PageHeader from '@/components/PageHeader.vue'
import SectionCard from '@/components/SectionCard.vue'
import GameEventForm from '@/components/GameEventForm.vue'

const props = defineProps<{
  game: { id: number; name: string }
  eventTypes: string[]
}>()

const game = props.game
const eventTypes = props.eventTypes

function navigate(url: string) {
  router.visit(url)
}
</script>
