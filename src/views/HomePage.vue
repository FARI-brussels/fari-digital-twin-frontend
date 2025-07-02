<script setup lang="ts">

import Layout from "../components/Layout.vue";
import {Button} from "@/components/ui/button";
import bxlScreenshot from '/src/assets/bxl_screenshot.png'

</script>
<template>
  <section class="min-h-[80vh] flex flex-col-reverse lg:flex-row items-center justify-between px-4 lg:px-20 py-10">
    <div class="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
      <h1 class="text-5xl md:text-6xl xl:text-7xl font-medium mt-8 max-w-2xl text-balance">
        Discover the city like never before
      </h1>
      <p class="mt-8 max-w-2xl text-lg">
        Experience Brussels as if you were there: live feeds of transport, air quality, and urban happenings… all updated instantly.
        Explore an immersive digital twin that reflects the capital’s heartbeat.
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
    <div class="w-full lg:w-1/2 flex justify-center items-center">
      <img
          :src="bxlScreenshot"
          alt="Brussels map"
          class="max-w-full h-auto max-h-[520px] rounded-2xl shadow-xl"
          style="object-fit: cover;"
      />
    </div>
  </section>
</template>
