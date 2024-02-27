import { type UseQueryOptions, type UseQueryResult, type UseMutationOptions, type UseMutationResult, QueryClient } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';
import { DataSyncError } from './DataSyncError';
/**
 * @REACT-TODO This is temporary. We need to allow each app to define their own QueryClient.
 * All of the functions below will have to be moved to a factory wrapper
 */
export declare const queryClient: QueryClient;
export declare function invalidateQuery(key: string): void;
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
type DataSyncMutation<Value> = Omit<UseMutationOptions<Value>, 'mutationKey'>;
type DataSyncQuery<Value> = Omit<UseQueryOptions<Value>, 'queryKey'>;
type DataSyncConfig<Schema extends z.ZodSchema, Value extends z.infer<Schema>> = {
    query?: DataSyncQuery<Value>;
    mutation?: DataSyncMutation<Value>;
};
/**
 * This is what `useDataSync` returns
 */
type DataSyncHook<Schema extends z.ZodSchema, Value extends z.infer<Schema>> = [
    UseQueryResult<Value>,
    UseMutationResult<Value, DataSyncError | Error, Value>
];
/**
 * React Query hook for DataSync.
 * @param namespace - The namespace of the endpoint.
 * @param key - The key of the value that's being synced.
 * @param schema - The Zod schema to validate the value against.
 * @param config - React Query configuration.
 * @param params - key/value pairs to be used as GET parameters.
 * @returns A tuple of React Query hooks.
 * @see https://tanstack.com/query/v5/docs/react/reference/useQuery
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 */
export declare function useDataSync<Schema extends z.ZodSchema, Value extends z.infer<Schema>, Key extends string>(namespace: string, key: Key, schema: Schema, config?: DataSyncConfig<Schema, Value>, params?: Record<string, string | number>): DataSyncHook<Schema, Value>;
/**
 * Use React Query mutations to dispatch custom DataSync Actions.
 */
export type DataSyncActionConfig<ActionRequestSchema extends z.ZodSchema, ActionRequestData extends z.infer<ActionRequestSchema>, StateSchema extends z.ZodSchema, ActionSchema extends z.ZodSchema, ActionResult extends z.infer<ActionSchema>, CurrentState extends z.infer<StateSchema>> = {
    /**
     * The project namespace, for example: 'jetpack_boost_ds'
     */
    namespace: string;
    /**
     * The name of the DataSync option.
     */
    key: string;
    /**
     * The name of the DataSync action.
     */
    action_name: string;
    /**
     * The Zod schema for the DataSync state.
     */
    schema: {
        /**
         * The DataSync state schema
         */
        state: StateSchema;
        /**
         * The action endpoint response schema.
         */
        action_response: ActionSchema;
        /**
         * Data that's sent to the action endpoint.
         */
        action_request: ActionRequestSchema;
    };
    callbacks?: {
        /**
         * Callback that's called when the action is dispatched.
         * This is useful for optimistic updates, must return the new state.
         */
        optimisticUpdate?: (requestData: ActionRequestData, state: CurrentState) => CurrentState;
        /**
         * Callback that's called after the action endpoint response is received.
         * If a state object is returned, it will be used to update the state.
         */
        onResult?: (result: ActionResult, state: CurrentState) => void | CurrentState;
    };
    /**
     * React Query mutation options passed to `useMutate`.
     * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
     */
    mutationOptions?: UseMutationOptions<ActionResult, unknown, ActionRequestData, {
        previousValue: CurrentState;
    }>;
    /**
     * GET parameters to be passed to the action endpoint.
     * These are used to build the query key.
     * @see https://tanstack.com/query/v5/docs/guides/query-keys
     */
    params?: Record<string, string | number>;
};
export declare function useDataSyncAction<StateSchema extends z.ZodSchema, ActionSchema extends z.ZodSchema, ActionRequestSchema extends z.ZodSchema, ActionRequestData extends z.infer<ActionRequestSchema>, ActionResult extends z.infer<ActionSchema>, CurrentState extends z.infer<StateSchema>>({ namespace, key, action_name, schema, callbacks, mutationOptions, params, }: DataSyncActionConfig<ActionRequestSchema, ActionRequestData, StateSchema, ActionSchema, ActionResult, CurrentState>): UseMutationResult<DataSyncMutation<CurrentState>, unknown, ActionRequestData, unknown>;
type SubsetMutation<T> = {
    mutate: (newValue: T) => void;
    isSuccess: boolean;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
};
export declare function useDataSyncSubset<Schema extends z.ZodSchema, Value extends z.infer<Schema>, K extends keyof Value>(hook: DataSyncHook<Schema, Value>, key: K): [Value[K], SubsetMutation<Value[K]>];
export {};
