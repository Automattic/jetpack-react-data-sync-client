import { type UseQueryOptions, type UseQueryResult, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';
/**
 * React Query Provider for DataSync.
 * This is necessary for React Query to work.
 * @see https://tanstack.com/query/v5/docs/react/reference/QueryClientProvider
 */
export declare function DataSyncProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
/**
 * React Query configuration type for DataSync.
 */
type DataSyncConfig<Schema extends z.ZodSchema, Value extends z.infer<Schema>> = {
    query?: Omit<UseQueryOptions<Value>, 'queryKey'>;
    mutation?: Omit<UseMutationOptions<Value>, 'mutationKey'>;
};
/**
 * This is what `useDataSync` returns
 */
type DataSyncHook<Schema extends z.ZodSchema, Value extends z.infer<Schema>> = [
    UseQueryResult<Value>,
    UseMutationResult<Value>
];
/**
 * React Query hook for DataSync.
 * @param namespace - The namespace of the endpoint.
 * @param key - The key of the value that's being synced.
 * @param schema - The Zod schema to validate the value against.
 * @param config - React Query configuration.
 * @returns A tuple of React Query hooks.
 * @see https://tanstack.com/query/v5/docs/react/reference/useQuery
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 */
export declare function useDataSync<Schema extends z.ZodSchema, Value extends z.infer<Schema>, Key extends string>(namespace: string, key: Key, schema: Schema, config?: DataSyncConfig<Schema, Value>, params?: Record<string, string | number>): DataSyncHook<Schema, Value>;
export {};
