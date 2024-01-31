/**
 * DataSync Error returned by the REST API.
 */
type ErrorData = {
    location: string | URL;
    status: number | 'aborted' | 'error_with_message' | 'failed_to_sync' | 'json_parse_error' | 'json_empty' | 'response_not_ok' | 'schema_error';
    namespace: string;
    method?: string;
    key: string;
    error?: unknown;
    data: unknown;
};
export declare class DataSyncError extends Error {
    message: string;
    info: ErrorData;
    name: string;
    constructor(message: string, info: ErrorData);
    /**
     * This is a helper method to log and format DataSync errors in the console.
     * It's only called when `window.datasync_debug` is set to `true`.
     */
    private debugMessage;
}
export {};
