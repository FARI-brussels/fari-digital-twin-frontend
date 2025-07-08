<template>
  <nav class="main-nav">
    <router-link to="/library/assets">3D Asset Library</router-link>
    <router-link to="/library/maps">Map Library</router-link>
    <router-link to="/library/tilesets">Tileset Library</router-link>
    <router-link to="/library/demo">Demo</router-link>
  </nav>
  <router-view />
</template>
<script setup lang="ts">
</script>
<style scoped>
.main-nav {
  background-color: #333;
  padding: 15px 30px;
  display: flex;
  justify-content: center;
  gap: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.main-nav a {
  color: #fff;
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1em;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.main-nav a:hover,
.main-nav a.router-link-exact-active {
  background-color: #555;
}
</style>