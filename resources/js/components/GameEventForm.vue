<template>
  <form class="flex flex-col gap-4" @submit.prevent="submit">
    <input type="hidden" name="game_id" :value="form.game_id" />

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-600">Title</label>
          <InputText v-model="form.title" required />
        </div>
      </div>
      <div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-600">Event Type</label>
          <Dropdown
            v-model="form.event_type"
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
          />
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-sm text-600">Description</label>
      <Textarea v-model="form.description" rows="4" auto-resize placeholder="Optional summary" />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-600">Start Date</label>
          <Calendar v-model="startDate" date-format="yy-mm-dd" show-icon />
        </div>
      </div>
      <div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-600">End Date</label>
          <Calendar v-model="endDate" date-format="yy-mm-dd" show-icon />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <Checkbox v-model="form.affects_pricing" :binary="true" />
      <label>Impacts pricing trends</label>
    </div>

    <div class="flex justify-end gap-2">
      <slot name="footer" />
      <Button type="submit" :label="submitLabel" icon="pi pi-save" :loading="form.processing" />
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useForm } from '@inertiajs/vue3'
import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

interface FormProps {
  gameId: number
  eventTypes: string[]
  submitUrl: string
  method?: 'post' | 'patch'
  initial?: {
    eventType?: string
    title?: string
    description?: string | null
    startDate?: string | null
    endDate?: string | null
    affectsPricing?: boolean
  }
}

const props = withDefaults(defineProps<FormProps>(), {
  method: 'post',
  initial: undefined,
})

const typeOptions = computed(() =>
  props.eventTypes.map((value) => ({
    value,
    label: value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
)

const form = useForm({
  game_id: props.gameId,
  event_type: props.initial?.eventType ?? props.eventTypes[0] ?? '',
  title: props.initial?.title ?? '',
  description: props.initial?.description ?? '',
  affects_pricing: props.initial?.affectsPricing ?? false,
  start_date: props.initial?.startDate ?? '',
  end_date: props.initial?.endDate ?? '',
})

const startDate = ref<Date | null>(
  props.initial?.startDate ? new Date(props.initial.startDate) : null
)
const endDate = ref<Date | null>(props.initial?.endDate ? new Date(props.initial.endDate) : null)

const submitLabel = computed(() => (props.method === 'patch' ? 'Update Event' : 'Create Event'))

function formatDate(value: Date | null) {
  if (!value) return ''
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function submit() {
  form.transform((data: typeof form.data) => ({
    ...data,
    start_date: formatDate(startDate.value),
    end_date: formatDate(endDate.value),
  }))

  if (props.method === 'patch') {
    form.patch(props.submitUrl, { preserveScroll: true })
  } else {
    form.post(props.submitUrl, { preserveScroll: true })
  }
}
</script>
