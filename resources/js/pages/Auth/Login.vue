<template>
  <div class="min-h-screen flex items-center justify-center surface-ground p-4">
    <div class="w-full max-w-md">
      <div class="surface-card p-6 shadow-2 border-round">
        <div class="text-center mb-6">
          <h1 class="text-3xl font-semibold text-color mb-2">Login</h1>
          <p class="text-600">Sign in to your MythicStats account</p>
        </div>

        <FlashMessages />

        <form @submit.prevent="submit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label for="email" class="text-sm font-medium text-color">Email</label>
            <InputText
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Enter your email"
              required
              :class="{ 'p-invalid': form.errors.email }"
            />
            <small v-if="form.errors.email" class="p-error">{{ form.errors.email }}</small>
          </div>

          <div class="flex flex-col gap-1">
            <label for="password" class="text-sm font-medium text-color">Password</label>
            <Password
              id="password"
              v-model="form.password"
              placeholder="Enter your password"
              :feedback="false"
              toggle-mask
              required
              :class="{ 'p-invalid': form.errors.password }"
            />
            <small v-if="form.errors.password" class="p-error">{{ form.errors.password }}</small>
          </div>

          <Button
            type="submit"
            label="Login"
            icon="pi pi-sign-in"
            :loading="form.processing"
            class="w-full"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useForm } from '@inertiajs/vue3'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import FlashMessages from '@/components/FlashMessages.vue'

interface LoginProps {
  isDevelopment?: boolean
}

const props = withDefaults(defineProps<LoginProps>(), {
  isDevelopment: false,
})

const form = useForm({
  email: props.isDevelopment ? 'josh@mythicfoxgames.com' : '',
  password: props.isDevelopment ? 'wNr8nz9Ap6' : '',
})

function submit() {
  form.post('/login', {
    preserveScroll: true,
    onError: () => {
      // Errors are handled via flash messages from the server
    },
  })
}
</script>

