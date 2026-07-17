"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryClient = void 0;
exports.invalidateQuery = invalidateQuery;
exports.DataSyncProvider = DataSyncProvider;
exports.useDataSync = useDataSync;
exports.useDataSyncAction = useDataSyncAction;
exports.useDataSyncSubset = useDataSyncSubset;
const react_query_1 = require("@tanstack/react-query");
const react_1 = require("react");
const DataSync_1 = require("./DataSync");
const DataSyncError_1 = require("./DataSyncError");
/**
 * @REACT-TODO This is temporary. We need to allow each app to define their own QueryClient.
 * All of the functions below will have to be moved to a factory wrapper
 */
exports.queryClient = new react_query_1.QueryClient();
function invalidateQuery(key) {
    exports.queryClient.invalidateQueries({ queryKey: [key] });
}
/**
 * React Query Provider for DataSync.
 * This is necessary for React Query to work.
 * @see https://tanstack.com/query/v5/docs/react/reference/QueryClientProvider
 */
function DataSyncProvider(props) {
    return (0, react_1.createElement)(react_query_1.QueryClientProvider, { client: exports.queryClient }, props.children);
}
/**
 * Build a query key from a key and params.
 *
 * @param {string} key    - The key of the value that's being synced.
 * @param {Object} params - key/value pairs to be used as arguments to the query parameters.
 */
function buildQueryKey(key, params) {
    return [
        key,
        ...Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, v]) => v),
    ];
}
/**
 * React Query hook for DataSync.
 * @param namespace - The namespace of the endpoint.
 * @param key       - The key of the value that's being synced.
 * @param schema    - The Zod schema to validate the value against.
 * @param config    - React Query configuration.
 * @param params    - key/value pairs to be used as GET parameters.
 * @returns A tuple of React Query hooks.
 * @see https://tanstack.com/query/v5/docs/react/reference/useQuery
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 */
function useDataSync(namespace, key, schema, config = {}, params = {}) {
    const datasync = new DataSync_1.DataSync(namespace, key, schema);
    const queryKey = buildQueryKey(key, params);
    /**
     * Defaults for `useQuery`:
     * - `queryKey` is the key of the value that's being synced.
     * - `queryFn` is wired up to DataSync `GET` method.
     * - `initialData` gets the value from the global window object.
     * - `staleTime` is set to 1 second by default; to prevent immediate re-fetching after setting a value.
     *
     * If your property is lazy-loaded, you should populate `initialData` with a value manually.
     * ```js
     * 		const [ data ] = useDataSync( 'namespace', 'key', schema, {
     * 			initialData: { foo: 'bar' },
     * 		} );
     * ```
     */
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- Sticking `datasync` in the key seems wrong, but what would be right?
    const queryConfigDefaults = {
        queryKey,
        queryFn: ({ signal }) => datasync.GET(params, signal),
        staleTime: 1 * 1000,
        initialData: () => {
            try {
                return datasync.getInitialValue();
            }
            catch {
                return undefined;
            }
        },
    };
    // AbortController is used to track rapid value mutations
    // and will cancel in-flight requests and prevent
    // the optimistic value from being reverted.
    const getAbortController = () => {
        const defaults = exports.queryClient.getMutationDefaults(queryKey);
        return defaults?.meta?.abortController instanceof AbortController
            ? defaults.meta.abortController
            : undefined;
    };
    const setAbortController = (abortController) => {
        exports.queryClient.setMutationDefaults(queryKey, {
            meta: {
                abortController,
            },
        });
    };
    /**
     * Defaults for `useMutation`:
     * - `mutationKey` is the key of the value that's being synced.
     * - `mutationFn` is wired up to DataSync `SET` method.
     * - `onMutate` is used to optimistically update the value before the request is made.
     * - `onError` is used to revert the value back to the previous value if the request fails.
     * - `onSettled` is used to invalidate the query after the request is made.
     *
     * @see https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
     */
    const mutationConfigDefaults = {
        meta: {
            abortController: null,
        },
        // Mutation function that's called when the mutation is triggered
        mutationFn: value => datasync.SET(value, params, getAbortController()?.signal),
        // Mutation actions that occur before the mutationFn is called
        onMutate: async (data) => {
            // If there's any existing mutations in progress with the same key, cancel them.
            const existingAbortController = getAbortController();
            if (existingAbortController) {
                existingAbortController.abort();
            }
            setAbortController(new AbortController());
            const value = schema.parse(data);
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await exports.queryClient.cancelQueries({ queryKey });
            // Snapshot the previous value
            const previousValue = exports.queryClient.getQueryData(queryKey);
            // Optimistically update the cached state to the new value
            exports.queryClient.setQueryData(queryKey, value);
            // Return a context object with the snapshotted value
            return { previousValue, optimisticValue: value };
        },
        onError: (err, _, context) => {
            if (err instanceof DataSyncError_1.DataSyncError && err.isAborted()) {
                // If the request was aborted, this means that another mutation
                // has already been dispatched and has already updated
                // the optimistic value, so there's nothing to revert.
                return;
            }
            // Revert the optimistic update to the previous value on error
            exports.queryClient.setQueryData(queryKey, context.previousValue);
        },
        onSuccess: (data) => {
            exports.queryClient.setQueryData(queryKey, data);
        },
        onSettled: (_, error) => {
            // Clear the abortController on either success or failure that is not an abort
            if (!error || (error instanceof DataSyncError_1.DataSyncError && !error.isAborted())) {
                setAbortController(null);
            }
        },
    };
    return [
        (0, react_query_1.useQuery)({ ...queryConfigDefaults, ...config.query }),
        (0, react_query_1.useMutation)({ ...mutationConfigDefaults, ...config.mutation }),
    ];
}
function useDataSyncAction({ namespace, key, action_name, schema, callbacks = {}, mutationOptions, params = {}, }) {
    const queryKey = buildQueryKey(key, params);
    const datasync = new DataSync_1.DataSync(namespace, key, schema.state);
    const mutationConfigDefaults = {
        mutationKey: queryKey,
        mutationFn: async (value) => {
            const result = await datasync.ACTION(action_name, schema.action_request.parse(value), schema.action_response);
            try {
                const currentValue = exports.queryClient.getQueryData(queryKey);
                const processedResult = await callbacks.onResult(result, currentValue);
                const data = processedResult === undefined ? currentValue : schema.state.parse(processedResult);
                if (processedResult !== undefined) {
                    exports.queryClient.setQueryData(queryKey, data);
                }
                return data;
            }
            catch {
                return exports.queryClient.getQueryData(queryKey);
            }
        },
        onMutate: async (requestData) => {
            // Cancel any outgoing refetches
            // (so they don't overwrite our optimistic update)
            await exports.queryClient.cancelQueries({ queryKey: queryKey });
            // Snapshot the previous value
            const previousValue = exports.queryClient.getQueryData(queryKey);
            if (callbacks.optimisticUpdate) {
                const value = await callbacks.optimisticUpdate(requestData, previousValue);
                exports.queryClient.setQueryData(queryKey, value);
            }
            // Return a context object with the snapshotted value
            return { previousValue };
        },
        onError: (_, __, context) => {
            exports.queryClient.setQueryData(queryKey, context.previousValue);
        },
        onSettled: () => {
            exports.queryClient.invalidateQueries({ queryKey });
        },
    };
    return (0, react_query_1.useMutation)({
        ...mutationConfigDefaults,
        ...mutationOptions,
    });
}
function useDataSyncSubset(hook, key) {
    const [query, mutation] = hook;
    const [isPending, setIsPending] = (0, react_1.useState)(false);
    const [isError, setIsError] = (0, react_1.useState)(false);
    const [isSuccess, setIsSuccess] = (0, react_1.useState)(false);
    const [isIdle, setIsIdle] = (0, react_1.useState)(true);
    const [error, setError] = (0, react_1.useState)(null);
    const mutate = (0, react_1.useCallback)((newValue) => {
        if (!query.data) {
            return;
        }
        setIsPending(true);
        mutation.mutate({
            ...query.data,
            [key]: newValue,
        });
    }, [query.data, mutation, key]);
    const reset = (0, react_1.useCallback)(() => {
        setIsPending(false);
        setIsError(false);
        setIsSuccess(false);
        setIsIdle(true);
        setError(null);
    }, []);
    (0, react_1.useEffect)(() => {
        if (!isPending) {
            return;
        }
        setIsError(mutation.isError);
        setIsSuccess(mutation.isSuccess);
        setError(mutation.error);
        if (mutation.isSuccess || mutation.isError) {
            setIsPending(false);
        }
    }, [mutation.isError, mutation.error, mutation.isSuccess, isPending]);
    return [
        query.data?.[key],
        {
            isIdle,
            isSuccess,
            isPending,
            isError,
            error,
            mutate,
            reset,
        },
    ];
}
//# sourceMappingURL=DataSyncHooks.js.map