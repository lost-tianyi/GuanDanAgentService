<template>
  <img
    class="joker-card-art"
    :class="variant === 'SJ' ? 'joker-card-art--small' : 'joker-card-art--big'"
    :src="variant === 'SJ' ? ui.jokerSmall : ui.jokerBig"
    alt=""
    draggable="false"
  />
</template>

<script setup lang="ts">
import { ui } from '@/assets/ui/urls'

defineProps<{
  variant: 'SJ' | 'BJ'
}>()
</script>

<style scoped>
.joker-card-art {
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
  object-fit: cover;
  border-radius: 6px;
}
</style>
