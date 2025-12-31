<template>
  <Card v-if="legend || imageSrc" class="map-legend">
    <CardHeader class="map-legend__header">
      <div class="map-legend__header-content">
        <Map v-if="showIcon" class="map-legend__icon" />
        <CardTitle class="map-legend__title">
          {{ title }}
        </CardTitle>
      </div>
    </CardHeader>
    <CardContent class="map-legend__content">
      <div v-if="legend?.items" class="map-legend__items">
        <div
          v-for="(item, index) in legend.items"
          :key="index"
          class="map-legend__item"
        >
          <div
            class="map-legend__color"
            :style="{ backgroundColor: item.color }"
          />
          <span class="map-legend__label">{{ item.label }}</span>
        </div>
      </div>

      <img
        v-else-if="imageSrc"
        :key="imageSrc"
        :src="imageSrc"
        :alt="imageAlt"
        class="map-legend__image"
        loading="lazy"
        @error="handleImageError"
      />
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Map } from 'lucide-vue-next'

export interface LegendItem {
  color: string
  label: string
}

export interface Legend {
  title?: string
  items: LegendItem[]
}

const props = withDefaults(
  defineProps<{
    legend?: Legend | null
    imageSrc?: string
    imageAlt?: string
    title?: string
    showIcon?: boolean
  }>(),
  {
    imageAlt: 'Layer Legend',
    title: 'Legend',
    showIcon: false,
  }
)

const title = computed(() => {
  return props.legend?.title || props.title
})

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>

<style scoped lang="scss">
.map-legend {
  position: absolute;
  right: 1rem;
  bottom: 2rem;
  z-index: 10;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 10%);
  background: hsl(var(--background) / 95%);
  backdrop-filter: blur(8px);

  &__header {
    padding: 0.5rem 1rem;
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__icon {
    width: 1rem;
    height: 1rem;
    color: hsl(var(--muted-foreground));
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 500;
  }

  &__content {
    padding: 0 0.5rem 0.5rem;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  &__color {
    flex-shrink: 0;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 0.125rem;
  }

  &__label {
    color: hsl(var(--muted-foreground));
  }

  &__image {
    max-width: 12rem;
    max-height: 16rem;
    border-radius: 0.25rem;
    border: 1px solid hsl(var(--border));
  }
}
</style>