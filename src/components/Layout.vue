<template>
  <div class="h-screen flex flex-col">
    <div
      :class="[
        'z-50 transition-all duration-500 ease-in-out',
        isScrolled
          ? ['sticky top-0 px-6 py-4', isScrollingUp ? 'bg-primary/50 backdrop-blur-sm' : '']
          : ['relative px-0 py-0', showBackgroundOnTop ? 'bg-primary' : '']
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
const isScrollingUp = ref(false);
const showBackgroundOnTop = ref(false);
let lastScrollY = 0;
let topTimeout: ReturnType<typeof setTimeout> | null = null;

const handleScroll = () => {
  const currentScrollY = window.scrollY;
  const wasScrolled = isScrolled.value;

  isScrolled.value = currentScrollY > 0;
  isScrollingUp.value = currentScrollY < lastScrollY;
  lastScrollY = currentScrollY;

  // When reaching top while scrolling up, show background during transition
  if (wasScrolled && !isScrolled.value && isScrollingUp.value) {
    showBackgroundOnTop.value = true;
    if (topTimeout) clearTimeout(topTimeout);
    topTimeout = setTimeout(() => {
      showBackgroundOnTop.value = false;
    }, 500); // Match transition duration
  }
};

onMounted(() =>
  window.addEventListener('scroll', handleScroll, { passive: true })
);

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (topTimeout) clearTimeout(topTimeout);
});
</script>
