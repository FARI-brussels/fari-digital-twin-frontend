<template>
  <Layout>
    <main class="w-full">
      <RouterView/>
    </main>
  </Layout>
</template>

<script setup>
// This component now only serves as the main layout with navigation.
import Layout from "./components/Layout.vue";
</script>
