import { z } from 'zod';
/**
 * A syncable value with a nonce that's parsed by Zod.
 */
export type ParsedValue<T extends z.ZodSchema> = {
    value: z.infer<T>;
    nonce: string;
};
export type SyncedStoreError<T> = {
    time: number;
    status: number | string;
    message: string;
    location: string;
    value: T;
    previousValue: T;
};
/**
 * JSON Schema form Zod
 * Straight out of the docs:
 * https://github.com/colinhacks/zod
 */
declare const literalSchema: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | {
    [key: string]: Json;
} | Json[];
export declare const jsonSchema: z.ZodType<Json>;
export type JSONSchema = z.infer<typeof jsonSchema>;
export {};
