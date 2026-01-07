<template>
  <div class="h-screen flex flex-col">
    <div 
      :class="[
        'z-50 transition-all duration-500 ease-in-out',
        isScrolled 
          ? 'sticky top-0 px-6 py-4' 
          : 'relative px-0 py-0'
      ]"
    >
      <Header 
        :compact="isScrolled"
        :class="[
          'transition-all duration-500 ease-in-out',
          isScrolled 
            ? 'rounded-2xl bg-primary/65 backdrop-blur-md shadow-lg border border-white/10' 
            : 'bg-primary'
        ]"
      />
    </div>
    <main class="flex-1">
      <slot />
    </main> 
    <LoginDialog v-model="isLoginDialogOpen" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Header from "./Header.vue";
import LoginDialog from "./LoginDialog.vue";
import { useLoginDialog } from '@/composables/useLoginDialog';

const { isOpen: isLoginDialogOpen } = useLoginDialog();


const isScrolled = ref(false);

const handleScroll = () => isScrolled.value = window.scrollY > 0;

onMounted(() => 
  window.addEventListener('scroll', handleScroll, { passive: true })
);

onUnmounted(() => 
  window.removeEventListener('scroll', handleScroll)
);
</script>
