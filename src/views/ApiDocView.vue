<template>
  <div>
    <div id="redoc-container"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Ajoute le script Redoc si pas déjà présent
  if (!document.getElementById('redoc-script')) {
    const script = document.createElement('script')
    script.id = 'redoc-script'
    script.src = 'https://unpkg.com/redoc@latest/bundles/redoc.standalone.js'
    script.onload = renderRedoc
    document.body.appendChild(script)
  } else {
    renderRedoc()
  }

  function renderRedoc() {
    // URL vers ton fichier OpenAPI/Swagger (YAML ou JSON)
    window.Redoc.init('/openapi.yaml', {
      scrollYOffset: 50,
      hideDownloadButton: true
    }, document.getElementById('redoc-container'))
  }
})
</script>