/**
 * Mutation Factory - Reduces boilerplate for TanStack Query mutations
 * Creates mutations with automatic cache invalidation
 */
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/vue-query';

/**
 * Creates a mutation hook that invalidates specified query keys on success
 */
export function createMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidateKeys: QueryKey[]
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onSuccess: () => {
        invalidateKeys.forEach(key => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      },
    });
  };
}

/**
 * Creates a mutation hook with optimistic updates
 */
export function createOptimisticMutation<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateKeys: QueryKey[];
    onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
    onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  }
) {
  return () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn,
      onMutate: options.onMutate,
      onError: options.onError,
      onSuccess: () => {
        options.invalidateKeys.forEach(key => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      },
      onSettled: () => {
        options.invalidateKeys.forEach(key => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      },
    });
  };
}
