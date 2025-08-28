import { ref, Ref } from 'vue'

export interface FormModalOptions<T> {
  defaultValues: T
  onSubmit?: (data: T) => Promise<void>
  onClose?: () => void
}

export function useFormModal<T extends Record<string, any>>(
  options: FormModalOptions<T>
) {
  const isOpen = ref(false)
  const isSubmitting = ref(false)
  const formData = ref<T>({ ...options.defaultValues }) as Ref<T>
  const error = ref<string | null>(null)

  const open = (initialData?: Partial<T>) => {
    formData.value = {
      ...options.defaultValues,
      ...initialData
    } as T
    error.value = null
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    error.value = null
    options.onClose?.()
  }

  const reset = () => {
    formData.value = { ...options.defaultValues } as T
    error.value = null
  }

  const submit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true
    error.value = null

    try {
      await options.onSubmit?.(formData.value)
      close()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '提交失敗'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    isOpen,
    isSubmitting,
    formData,
    error,
    open,
    close,
    reset,
    submit
  }
}
