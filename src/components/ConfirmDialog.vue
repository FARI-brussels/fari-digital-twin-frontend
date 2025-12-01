<script setup lang="ts">
/**
 * ConfirmDialog - Reusable confirmation modal
 * Uses shadcn-vue AlertDialog for delete confirmations
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-vue-next';

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  description: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

// ============================================================================
// Handlers
// ============================================================================

function handleOpenChange(value: boolean): void {
  emit('update:open', value);
  if (!value) {
    emit('cancel');
  }
}

function handleConfirm(): void {
  emit('confirm');
}

function handleCancel(): void {
  emit('update:open', false);
  emit('cancel');
}
</script>

<template>
  <AlertDialog :open="props.open" @update:open="handleOpenChange">
    <AlertDialogContent class="sm:max-w-[425px]">
      <AlertDialogHeader>
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            :class="{
              'bg-destructive/10': props.variant === 'danger',
              'bg-amber-500/10': props.variant === 'warning',
              'bg-muted': props.variant === 'default',
            }"
          >
            <AlertTriangle
              class="h-5 w-5"
              :class="{
                'text-destructive': props.variant === 'danger',
                'text-amber-500': props.variant === 'warning',
                'text-muted-foreground': props.variant === 'default',
              }"
            />
          </div>
          <div>
            <AlertDialogTitle>{{ props.title }}</AlertDialogTitle>
            <AlertDialogDescription class="mt-1">
              {{ props.description }}
            </AlertDialogDescription>
          </div>
        </div>
      </AlertDialogHeader>
      <AlertDialogFooter class="mt-4">
        <AlertDialogCancel :disabled="props.loading" @click="handleCancel">
          {{ props.cancelText }}
        </AlertDialogCancel>
        <AlertDialogAction
          :disabled="props.loading"
          :class="{
            'bg-destructive text-destructive-foreground hover:bg-destructive/90': props.variant === 'danger',
            'bg-amber-500 text-white hover:bg-amber-600': props.variant === 'warning',
          }"
          @click="handleConfirm"
        >
          <span v-if="props.loading" class="flex items-center gap-2">
            <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Deleting...
          </span>
          <span v-else>{{ props.confirmText }}</span>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
