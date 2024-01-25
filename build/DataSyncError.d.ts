/**
 * DataSync Error returned by the REST API.
 */
export declare class DataSyncError extends Error {
    location: string;
    status: number | 'aborted' | 'error_with_message' | 'failed_to_sync' | 'json_parse_error' | 'json_empty' | 'schema_error';
    message: string;
    name: string;
    constructor(location: string, status: number | 'aborted' | 'error_with_message' | 'failed_to_sync' | 'json_parse_error' | 'json_empty' | 'schema_error', message: string);
}
