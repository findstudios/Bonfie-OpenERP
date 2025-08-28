import { ref, Ref, nextTick } from 'vue'

export interface ColorPickerOptions {
  presetColors?: Array<{ name: string; value: string }>
}

export function useColorPicker(options: ColorPickerOptions = {}) {
  const activeColorPicker = ref<number | null>(null)
  const colorWheelRefs = ref<Record<number, HTMLCanvasElement>>({} as any)

  const defaultPresetColors = [
    { name: '藍色', value: '#3B82F6' },
    { name: '綠色', value: '#10B981' },
    { name: '紫色', value: '#8B5CF6' },
    { name: '黃色', value: '#F59E0B' },
    { name: '紅色', value: '#EF4444' },
    { name: '粉紅', value: '#EC4899' },
    { name: '靓藍', value: '#6366F1' },
    { name: '青色', value: '#06B6D4' },
    { name: '橙色', value: '#F97316' },
    { name: '灰色', value: '#6B7280' },
    { name: '石板藍', value: '#475569' },
    { name: '翡翠綠', value: '#059669' }
  ]

  const presetColors = options.presetColors || defaultPresetColors

  const openColorPicker = (index: number) => {
    if (activeColorPicker.value === index) {
      activeColorPicker.value = null
    } else {
      activeColorPicker.value = index
      nextTick(() => {
        initColorWheel(index)
      })
    }
  }

  const closeColorPicker = () => {
    activeColorPicker.value = null
  }

  const initColorWheel = (index: number) => {
    const canvas = colorWheelRefs.value[index]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // 繪製色相漸變
    for (let x = 0; x < width; x++) {
      const hue = (x / width) * 360

      // 繪製亮度漸變
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, `hsl(${hue}, 100%, 100%)`)
      gradient.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`)
      gradient.addColorStop(1, `hsl(${hue}, 100%, 0%)`)

      ctx.fillStyle = gradient
      ctx.fillRect(x, 0, 1, height)
    }
  }

  const pickColorFromWheel = (event: MouseEvent, index: number): string => {
    const canvas = colorWheelRefs.value[index]
    if (!canvas) return '#000000'

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const ctx = canvas.getContext('2d')
    if (!ctx) return '#000000'

    const imageData = ctx.getImageData(x, y, 1, 1)
    const data = imageData.data

    const r = data[0]
    const g = data[1]
    const b = data[2]

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  const setupClickOutsideHandler = (callback?: () => void) => {
    const handler = (e: MouseEvent) => {
      if (activeColorPicker.value !== null) {
        const target = e.target as HTMLElement
        if (!target.closest('.relative')) {
          activeColorPicker.value = null
          callback?.()
        }
      }
    }

    document.addEventListener('click', handler)

    return () => {
      document.removeEventListener('click', handler)
    }
  }

  return {
    activeColorPicker,
    colorWheelRefs,
    presetColors,
    openColorPicker,
    closeColorPicker,
    pickColorFromWheel,
    setupClickOutsideHandler
  }
}
