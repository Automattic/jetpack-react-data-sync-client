"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSync = void 0;
const zod_1 = require("zod");
const DataSyncError_1 = require("./DataSyncError");
/**
 * DataSync class for synchronizing data between the client and the server.
 *
 * Expected Formatting:
 * http://localhost/wp-json/jetpack-favorites/status
 * - `http://localhost/wp-json` is the WP REST API endpoint, defined in window.{namespace}.rest_api
 * - `jetpack-favorites` is the "namespace"
 * - `status` is the "key"
 *
 * DataSync expects these values to be
 * available in the global window object in the following format: window[ namespace ][ key ]:
 *
 * Note: The keys are converted to be snake_case in Objects, but kebab-case in URLs.
 */
class DataSync {
    schema;
    /**
     * WordPress REST API Endpoint configuration.
     * @param wpDatasyncUrl - For example: http://localhost/wp-json/jetpack-favorites
     */
    wpDatasyncUrl;
    /**
     * Nonce for WordPress REST API interaction.
     * This is different from the endpoint nonce that's used for every individual endpoint.
     * @see https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/#cookie-authentication
     */
    wpRestNonce;
    /**
     * Nonce for every endpoint.
     * This is different from WP REST API nonce.
     */
    endpointNonce = '';
    /**
     * The namespace of the endpoint.
     * This matches the name of the global variable (window.{name_space}.{endpoint_name})
     */
    namespace;
    /**
     * Same as namespace, but using dashes instead of underscores.
     */
    endpoint;
    /**
     * Key of the value that's being synced.
     */
    key;
    /**
     * Constructor for the DataSync class.
     *
     * Example usage:
     * ```js
     * const dataSync = new DataSync('namespace', 'key', schema);
     * ```
     * This would make a request to: http://localhost/wp-json/namespace/key
     *
     * @param namespace - The namespace of the endpoint. This matches the name of the global variable (window.{namespace}.{endpoint_name}).
     * @param key       - The key of the value that's being synced. This is used to fetch the value from the global window object.
     * @param schema    - The Zod schema to validate the value against. This ensures that the value is of the expected type.
     */
    constructor(namespace, key, schema) {
        this.schema = schema;
        this.namespace = namespace;
        this.key = key;
        /**
         * Convert underscores to dashes,
         * because all endpoints are kebab-case and options are snake_case.
         */
        this.endpoint = this.key.replaceAll('_', '-');
        /**
         * `window.[name].rest_api` is a special value that's required for the API to work.
         * It's populated by the `wp-js-data-sync` package and contains the REST API endpoint and nonce.
         */
        try {
            const { value, nonce } = this.getWindowValue('rest_api', zod_1.z.string().url());
            this.wpRestNonce = nonce;
            this.wpDatasyncUrl = value;
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to connect to REST API because of an invalid "window.${this.namespace}.rest_api" value:\n`, `	Expected Example: `, { value: 'https://example.com/wp-json', nonce: 'abc123' }, `\n	Received Value: `, window[namespace]?.rest_api, '\n\nError originated from: \n ', error);
        }
        /**
         * Setup the endpoint nonce
         */
        try {
            // Nonces always exist, even when the values are lazy-loaded.
            // That's why we don't care what the value schema is, we just want the nonce.
            const { nonce } = this.getWindowValue(this.key, zod_1.z.unknown());
            this.endpointNonce = nonce;
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(`Failed to connect to REST API because of an invalid "window.${this.namespace}.${this.key}" value:\n`, `	Expected Example: `, { value: '<any>', nonce: 'abc123', lazy: '<optional>' }, `\n	Received Value: `, window[namespace]?.[this.key], '\n\nError originated from: \n ', error);
        }
    }
    /**
     * Helper function to get values
     * from the window object and validate them.
     *
     * @param valueName   - The name of the value. For example, `posts`.
     * @param valueSchema - The Zod schema to validate the value against.
     * @returns The parsed value.
     */
    getWindowValue(valueName, valueSchema) {
        const validator = zod_1.z.object({
            value: valueSchema,
            nonce: zod_1.z.string(),
        });
        /**
         * This function handles fetching nonces if they're there
         * But it shouldn't trigger errors if the nonce is missing.
         * Allowing the client application to decide
         * how to handle missing nonces.
         *
         * This is useful, for example, if the `valueSchema` is set to something
         * like `z.string().optional()`. In this case, the application might be
         * okay with a missing value, so a missing nonce would trigger an unexpected
         * error.
         */
        const source = window[this.namespace][valueName]
            ? window[this.namespace][valueName]
            : { value: undefined, nonce: '' };
        try {
            return validator.parse(source);
        }
        catch (error) {
            throw new DataSyncError_1.DataSyncError(`Failed to parse global value at 'window.${this.namespace}.${valueName}'`, {
                ...this.describeSelf(),
                location: `window.${this.namespace}.${valueName}`,
                status: 'schema_error',
                error,
                data: source,
            });
        }
    }
    /**
     * Method to make a request to the endpoint.
     * @param  method          - The request method.
     * @param  partialPathname - The request path.
     * @param  value           - Data to send when using POST.
     * @param  params          - Append query params to the URL. Takes in an object of key/value pairs.
     * @param  abortSignal     - The abort signal.
     * @returns The parsed value.
     * @throws {ApiError}
     * @throws {Error}
     */
    async request(method, partialPathname, value, params, abortSignal, nonce) {
        const url = new URL(`${this.wpDatasyncUrl}/${partialPathname}`);
        if (params) {
            Object.keys(params).forEach(key => {
                url.searchParams.append(key, params[key].toString());
            });
        }
        const args = {
            method,
            signal: abortSignal,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': this.wpRestNonce,
                'X-Jetpack-WP-JS-Sync-Nonce': nonce || this.endpointNonce,
            },
            credentials: 'same-origin',
            body: null,
        };
        if (method === 'POST') {
            args.body = JSON.stringify({ JSON: value });
        }
        const result = await this.attemptRequest(url.toString(), args);
        let data;
        const text = await result.text();
        try {
            data = JSON.parse(text);
        }
        catch (error) {
            throw new DataSyncError_1.DataSyncError('Failed to JSON.parse() the response from the server.', {
                ...this.describeSelf(),
                location: url,
                method: args.method,
                status: 'json_parse_error',
                error,
                data: text,
            });
        }
        /**
         * `data.JSON` is used to keep in line with how WP REST API parses request json params
         * It also allows frees up the the endpoint to accept other values in the root of the JSON object
         * if that ever becomes necessary.
         * @see https://developer.wordpress.org/reference/classes/wp_rest_request/parse_json_params/
         * @see https://github.com/WordPress/wordpress-develop/blob/28f10e4af559c9b4dbbd1768feff0bae575d5e78/src/wp-includes/rest-api/class-wp-rest-request.php#L701
         */
        if (!data || !data.status) {
            throw new DataSyncError_1.DataSyncError('JSON response was empty', {
                ...this.describeSelf(),
                method,
                data,
                location: url,
                status: 'json_empty',
            });
        }
        if (data.status === 'error' && 'message' in data) {
            throw new DataSyncError_1.DataSyncError(data.message, {
                ...this.describeSelf(),
                method,
                location: url,
                status: 'error_with_message',
                data,
            });
        }
        if (!data || data.JSON === undefined) {
            throw new DataSyncError_1.DataSyncError('JSON response was empty', {
                ...this.describeSelf(),
                method,
                location: url,
                status: 'json_empty',
                data,
            });
        }
        return data.JSON;
    }
    /**
     * Method to parse the request.
     * @param method      - The request method.
     * @param requestPath - The request path.
     * @param value       - The request parameters.
     * @param abortSignal - The abort signal.
     * @returns The parsed value.
     */
    async parsedRequest(method, requestPath = '', value, params = {}, abortSignal) {
        const data = await this.request(method, requestPath, value, params, abortSignal);
        try {
            return this.schema.parse(data);
        }
        catch (error) {
            const url = `${this.wpDatasyncUrl}/${requestPath}`;
            throw new DataSyncError_1.DataSyncError(`Failed to validate response schema.`, {
                ...this.describeSelf(),
                data,
                location: url,
                method,
                status: 'schema_error',
                error,
            });
        }
    }
    describeSelf() {
        return {
            namespace: this.namespace,
            key: this.key,
            endpoint: this.endpoint,
        };
    }
    /**
     * A debugging utility -
     * Method to request a teapot response.
     */
    maybeRequestDisabled(url) {
        if (!window.location.hash.includes('ds-debug-disable=')) {
            return url;
        }
        const hashEntry = window.location.hash.split('ds-debug-disable=')[1];
        if (!hashEntry) {
            return url;
        }
        if (hashEntry.match(/[^a-zA-Z0-9-_,]/)) {
            // eslint-disable-next-line no-console
            console.error('Invalid ds-debug-disable hash entry:', hashEntry);
            return url;
        }
        const debugURL = new URL(url);
        debugURL.searchParams.set('ds-debug-disable', hashEntry);
        return debugURL.toString();
    }
    /**
     * Method to attempt the request.
     * @param url  - The request URL.
     * @param args - The request arguments.
     * @returns The result of the request.
     */
    async attemptRequest(url, args) {
        try {
            url = this.maybeRequestDisabled(url);
            const result = await fetch(url, args);
            if (!result.ok) {
                let errorText = result.status.toString();
                if (result.statusText) {
                    errorText = `${errorText} - ${result.statusText}`;
                }
                throw new DataSyncError_1.DataSyncError(`DS request failed: ${errorText}`, {
                    ...this.describeSelf(),
                    method: args.method,
                    location: url,
                    status: 'response_not_ok',
                    data: result,
                });
            }
            return result;
        }
        catch (error) {
            // Re-throw DataSyncErrors
            if (error instanceof DataSyncError_1.DataSyncError) {
                throw error;
            }
            const aborted = error instanceof DOMException && error.name === 'AbortError';
            const status = aborted ? 'aborted' : 'failed_to_sync';
            throw new DataSyncError_1.DataSyncError(error.message, {
                ...this.describeSelf(),
                method: args.method,
                location: url,
                status,
                data: null,
                error,
            });
        }
    }
    /**
     * Public Interface:
     *
     * Class member variables, instead of class methods, because they need
     * to be bound to the class instance, to make it easier to pass them
     * around as callbacks without losing the `this` context.
     */
    GET = async (params = {}, abortSignal) => {
        return await this.parsedRequest('GET', this.endpoint, undefined, params, abortSignal);
    };
    SET = async (value, params = {}, abortSignal) => {
        return await this.parsedRequest('POST', `${this.endpoint}/set`, value, params, abortSignal);
    };
    DELETE = async (params = {}, abortSignal) => {
        return await this.parsedRequest('POST', `${this.endpoint}/delete`, undefined, params, abortSignal);
    };
    /**
     * Trigger an endpoint action
     * @param name  - The name of the action.
     * @param value - The value to send to the endpoint.
     * @returns A direct response from the endpoint.
     */
    ACTION = async (name, value, schema) => {
        if (!(this.namespace in window) || !(this.key in window[this.namespace])) {
            throw new DataSyncError_1.DataSyncError(`"${this.namespace}.${this.key}" not found in window object`, {
                ...this.describeSelf(),
                location: `window.${this.namespace}.${this.key}`,
                status: 'schema_error',
                data: null,
            });
        }
        const actions = 'actions' in window[this.namespace][this.key]
            ? window[this.namespace][this.key].actions
            : false;
        // Check if the specific action name exists
        if (!actions || !actions[name]) {
            throw new DataSyncError_1.DataSyncError(`Nonce for Action "${name}" not found in window.${this.namespace}.${this.key}.actions`, {
                ...this.describeSelf(),
                location: `window.${this.namespace}.${this.key}.actions`,
                status: 'schema_error',
                data: actions,
            });
        }
        // Get the nonce for the specific action
        const nonce = actions[name];
        const url = `${this.endpoint}/action/${name}`;
        const result = await this.request('POST', url, value, {}, undefined, nonce);
        try {
            return schema.parse(result);
        }
        catch (error) {
            throw new DataSyncError_1.DataSyncError('Failed to parse the response', {
                location: url,
                ...this.describeSelf(),
                method: 'POST',
                error,
                status: 'schema_error',
                data: result,
            });
        }
    };
    /**
     * Method to get the initial value from the window object.
     * @returns The initial value.
     */
    getInitialValue = () => {
        return this.getWindowValue(this.key, this.schema).value;
    };
}
exports.DataSync = DataSync;
//# sourceMappingURL=DataSync.js.map