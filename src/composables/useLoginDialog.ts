// composables/useLoginDialog.ts
import { ref } from 'vue';

const isOpen = ref(false);

export function useLoginDialog() {
  function open() {
    isOpen.value = true;
  }

  function close() {
    isOpen.value = false;
  }

  return {
    isOpen,
    open,
    close,
  };
}