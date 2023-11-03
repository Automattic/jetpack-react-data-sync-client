import { type UseQueryOptions, type UseQueryResult, type UseMutationOptions, type UseMutationResult } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';
export declare function DataSyncProvider(props: {
    children: React.ReactNode;
}): JSX.Element;
type DataSyncFactory<T> = {
    useQuery: (config?: Omit<UseQueryOptions<T>, 'queryKey'>) => UseQueryResult<T>;
    useMutation: (config?: Omit<UseMutationOptions<T>, 'mutationKey'>) => UseMutationResult<T>;
};
export declare function useDataSync<Schema extends z.ZodSchema, Value extends z.infer<Schema>, Key extends string>(namespace: string, key: Key, schema: Schema): DataSyncFactory<Value>;
export {};
