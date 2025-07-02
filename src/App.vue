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

<style>
/* Global styles from the original App.vue */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 0;
}

/* Styles for the new navigation */
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

/* Resetting some page-specific styles that were global */
body {
  margin: 0;
  background-color: #f0f2f5;
}
</style>
