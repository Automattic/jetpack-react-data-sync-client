"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonSchema = void 0;
const zod_1 = require("zod");
/**
 * JSON Schema form Zod
 * Straight out of the docs:
 * https://github.com/colinhacks/zod
 */
const literalSchema = zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]);
exports.jsonSchema = zod_1.z.lazy(() => zod_1.z.union([literalSchema, zod_1.z.array(exports.jsonSchema), zod_1.z.record(exports.jsonSchema)]));
//# sourceMappingURL=types.js.map