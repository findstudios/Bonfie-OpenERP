<template>
  <div class="relative">
    <!-- 互動色塊 -->
    <button
      type="button"
      @click="colorPicker.openColorPicker(index)"
      class="flex h-10 w-full items-center gap-3 rounded-lg border-2 border-gray-300 px-3 transition-colors hover:border-gray-400"
    >
      <div
        class="size-6 rounded-md border border-gray-300"
        :style="{ backgroundColor: color }"
      />
      <span class="font-mono text-sm text-gray-700">{{ color || '選擇顏色' }}</span>
    </button>

    <!-- 顏色選擇卡片 -->
    <Transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 transform scale-95"
      enter-to-class="opacity-100 transform scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 transform scale-100"
      leave-to-class="opacity-0 transform scale-95"
    >
      <div
        v-if="colorPicker.activeColorPicker.value === index"
        class="absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
        style="width: 320px"
        @click.stop
      >
        <!-- 預設顏色 -->
        <div class="mb-4">
          <p class="mb-2 text-xs font-medium text-gray-500">快速選擇</p>
          <div class="grid grid-cols-8 gap-1">
            <button
              v-for="preset in colorPicker.presetColors"
              :key="preset.value"
              type="button"
              @click="selectColor(preset.value)"
              :class="[
                'relative size-8 rounded-md border transition-all',
                color === preset.value
                  ? 'border-gray-900 ring-2 ring-gray-400 ring-offset-1'
                  : 'border-gray-300 hover:border-gray-400'
              ]"
              :style="{ backgroundColor: preset.value }"
              :title="preset.name"
            >
              <CheckIcon
                v-if="color === preset.value"
                class="absolute inset-0 m-auto size-4 text-white"
              />
            </button>
          </div>
        </div>

        <!-- 色環選擇器 -->
        <div class="mb-4">
          <p class="mb-2 text-xs font-medium text-gray-500">自定義顏色</p>
          <div class="relative">
            <canvas
              :ref="el => colorPicker.colorWheelRefs.value[index] = el"
              width="280"
              height="140"
              class="cursor-crosshair rounded"
              @click="pickColor($event)"
            />
          </div>
        </div>

        <!-- 當前顏色顯示 -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="size-10 rounded-md border border-gray-300"
              :style="{ backgroundColor: color }"
            />
            <input
              :value="color"
              @input="selectColor($event.target.value)"
              type="text"
              placeholder="#000000"
              maxlength="7"
              class="w-24 rounded-md border border-gray-300 px-2 py-1 font-mono text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            @click="colorPicker.closeColorPicker()"
            class="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
          >
            確定
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { CheckIcon } from '@heroicons/vue/24/solid'

interface Props {
  color: string
  index: number
  colorPicker: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:color': [value: string]
}>()

const selectColor = (value: string) => {
  emit('update:color', value)
}

const pickColor = (event: MouseEvent) => {
  const color = props.colorPicker.pickColorFromWheel(event, props.index)
  selectColor(color)
}
</script>
