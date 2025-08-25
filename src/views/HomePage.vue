<template>
  <section
    class="flex min-h-[80vh] flex-col-reverse items-center justify-between px-4 py-10 lg:flex-row lg:px-20"
  >
    <div class="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
      <h1 class="mt-8 max-w-2xl text-5xl font-medium text-balance md:text-6xl xl:text-7xl">
        Discover the city like never before
      </h1>
      <p class="mt-8 max-w-2xl text-lg">
        Experience Brussels as if you were there: live feeds of transport, air quality, and urban
        happenings… all updated instantly. Explore an immersive digital twin that reflects the
        capital’s heartbeat.
      </p>
      <div class="mt-12 flex flex-col items-center gap-2 sm:flex-row lg:justify-start">
        <Button as-child size="lg" class="px-5 text-base">
          <RouterLink to="/register">
            <span class="text-nowrap">Register</span>
          </RouterLink>
        </Button>
        <Button as-child size="lg" variant="ghost" class="px-5 text-base">
          <RouterLink to="/library">
            <span class="text-nowrap">Asset Library</span>
          </RouterLink>
        </Button>
      </div>
    </div>
    <div class="flex w-full items-center justify-center lg:w-1/2">
      <img
        :src="bxlScreenshot"
        alt="Brussels map"
        class="h-auto max-h-[520px] max-w-full rounded-2xl shadow-xl"
        style="object-fit: cover"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import bxlScreenshot from '/src/assets/bxl_screenshot.png'
</script>
