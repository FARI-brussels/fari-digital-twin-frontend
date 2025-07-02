<template>
  <nav class="main-nav">
    <router-link to="/library/assets">3D Asset Library</router-link>
    <router-link to="/library/pointclouds">Point Cloud Library</router-link>
    <router-link to="/library/maps">Map Library</router-link>
    <router-link to="/library/tilesets">Tileset Library</router-link>
    <router-link to="/library/demo">Demo</router-link>
  </nav>
  <router-view />
</template>
<script setup lang="ts">
</script>