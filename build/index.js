"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataSyncError = exports.DataSync = void 0;
__exportStar(require("./DataSyncHooks"), exports);
var DataSync_1 = require("./DataSync");
Object.defineProperty(exports, "DataSync", { enumerable: true, get: function () { return DataSync_1.DataSync; } });
var DataSyncError_1 = require("./DataSyncError");
Object.defineProperty(exports, "DataSyncError", { enumerable: true, get: function () { return DataSyncError_1.DataSyncError; } });
//# sourceMappingURL=index.js.map