"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LwcConfigError = exports.NoLwcModuleFound = void 0;
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
class NoLwcModuleFound extends Error {
    constructor(importee, importer) {
        super(`Unable to resolve "${importee}" from "${importer}"`);
        this.code = 'NO_LWC_MODULE_FOUND';
    }
}
exports.NoLwcModuleFound = NoLwcModuleFound;
class LwcConfigError extends Error {
    constructor(message, { scope }) {
        super(`Invalid LWC configuration in "${scope}". ${message}`);
        this.code = 'LWC_CONFIG_ERROR';
        this.scope = scope;
    }
}
exports.LwcConfigError = LwcConfigError;
//# sourceMappingURL=errors.js.map