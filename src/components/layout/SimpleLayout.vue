<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 簡單的頂部標題 -->
    <header class="border-b bg-white shadow">
      <div class="px-6 py-4">
        <h1 class="text-xl font-bold text-gray-900">OpenERP管理系統 (簡化版)</h1>
      </div>
    </header>

    <!-- 主要內容 -->
    <main class="p-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// 簡化的布局組件，用於測試
</script>
