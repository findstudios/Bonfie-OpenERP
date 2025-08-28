import { ref } from 'vue'

export interface MessageOptions {
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

export function useSuccessMessage() {
  const show = ref(false)
  const message = ref('')
  const type = ref<'success' | 'error' | 'warning' | 'info'>('success')

  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const showMessage = (
    text: string,
    options: MessageOptions = {}
  ) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    message.value = text
    type.value = options.type || 'success'
    show.value = true

    const duration = options.duration || 3000
    timeoutId = setTimeout(() => {
      show.value = false
      timeoutId = null
    }, duration)
  }

  const hide = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    show.value = false
  }

  const success = (text: string, duration?: number) => {
    showMessage(text, { type: 'success', duration })
  }

  const error = (text: string, duration?: number) => {
    showMessage(text, { type: 'error', duration: duration || 5000 })
  }

  const warning = (text: string, duration?: number) => {
    showMessage(text, { type: 'warning', duration })
  }

  const info = (text: string, duration?: number) => {
    showMessage(text, { type: 'info', duration })
  }

  return {
    show,
    message,
    type,
    showMessage,
    hide,
    success,
    error,
    warning,
    info
  }
}
