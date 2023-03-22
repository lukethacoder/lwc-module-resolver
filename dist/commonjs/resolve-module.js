"use strict";
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModule = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// import resolve from 'resolve'
const utils_1 = require("./utils");
const errors_1 = require("./errors");
const types_1 = require("./types");
// override methods
const edits_1 = require("./edits");
function resolveModuleFromAlias(specifier, moduleRecord, opts) {
    const { name, path: modulePath } = moduleRecord;
    if (specifier !== name) {
        return;
    }
    const entry = path_1.default.resolve(opts.rootDir, modulePath);
    if (!fs_1.default.existsSync(entry)) {
        throw new errors_1.LwcConfigError(`Invalid alias module record "${JSON.stringify(moduleRecord)}", file "${entry}" does not exist`, { scope: opts.rootDir });
    }
    return (0, utils_1.createRegistryEntry)(entry, specifier, types_1.RegistryType.alias, opts);
}
function resolveModuleFromDir(specifier, moduleRecord, opts) {
    return (0, edits_1.resolveModuleFromDirEdit)(specifier, moduleRecord, opts);
}
function resolveModuleFromNpm(specifier, npmModuleRecord, opts) {
    const { npm, map: aliasMapping } = npmModuleRecord;
    let pkgJsonPath;
    try {
        pkgJsonPath = resolve.sync(`${npm}/package.json`, {
            basedir: opts.rootDir,
            preserveSymlinks: true,
        });
    }
    catch (error) {
        // If the module "package.json" can't be found, throw an an invalid config error. Otherwise
        // rethrow the original error.
        if (error.code === 'MODULE_NOT_FOUND') {
            throw new errors_1.LwcConfigError(`Invalid npm module record "${JSON.stringify(npmModuleRecord)}", "${npm}" npm module can't be resolved`, { scope: opts.rootDir });
        }
        throw error;
    }
    const packageDir = path_1.default.dirname(pkgJsonPath);
    const lwcConfig = (0, utils_1.getLwcConfig)(packageDir);
    (0, utils_1.validateNpmConfig)(lwcConfig, { rootDir: packageDir });
    let exposedModules = lwcConfig.expose;
    let reverseMapping;
    if (aliasMapping) {
        (0, utils_1.validateNpmAlias)(lwcConfig.expose, aliasMapping, { rootDir: packageDir });
        exposedModules = (0, utils_1.remapList)(lwcConfig.expose, aliasMapping);
        reverseMapping = (0, utils_1.transposeObject)(aliasMapping);
    }
    if (exposedModules.includes(specifier)) {
        for (const moduleRecord of lwcConfig.modules) {
            const aliasedSpecifier = reverseMapping && reverseMapping[specifier];
            const registryEntry = resolveModuleRecordType(aliasedSpecifier || specifier, moduleRecord, {
                rootDir: packageDir,
            });
            if (registryEntry) {
                if (aliasedSpecifier) {
                    registryEntry.specifier = specifier;
                    registryEntry.type = types_1.RegistryType.alias;
                }
                return registryEntry;
            }
        }
        throw new errors_1.LwcConfigError(`Unable to find "${specifier}" under npm package "${npmModuleRecord.npm}"`, { scope: packageDir });
    }
}
function resolveModuleRecordType(specifier, moduleRecord, opts) {
    const { rootDir } = opts;
    if ((0, utils_1.isAliasModuleRecord)(moduleRecord)) {
        return resolveModuleFromAlias(specifier, moduleRecord, { rootDir });
    }
    else if ((0, utils_1.isDirModuleRecord)(moduleRecord)) {
        return resolveModuleFromDir(specifier, moduleRecord, { rootDir });
    }
    else if ((0, utils_1.isNpmModuleRecord)(moduleRecord)) {
        return resolveModuleFromNpm(specifier, moduleRecord, opts);
    }
    throw new errors_1.LwcConfigError(`Unknown module record "${JSON.stringify(moduleRecord)}"`, {
        scope: rootDir,
    });
}
function resolveModule(importee, dirname, config) {
    if (typeof importee !== 'string') {
        throw new TypeError(`The importee argument must be a string. Received type ${typeof importee}`);
    }
    if (typeof dirname !== 'string') {
        throw new TypeError(`The dirname argument must be a string. Received type ${typeof dirname}`);
    }
    if (importee.startsWith('.') || importee.startsWith('/')) {
        throw new TypeError(`The importee argument must be a valid LWC module name. Received "${importee}"`);
    }
    const rootDir = (0, utils_1.findFirstUpwardConfigPath)(path_1.default.resolve(dirname));
    const lwcConfig = (0, utils_1.getLwcConfig)(rootDir);
    let modules = lwcConfig.modules || [];
    if (config) {
        const userConfig = (0, utils_1.normalizeConfig)(config, rootDir);
        modules = (0, utils_1.mergeModules)(userConfig.modules, modules);
    }
    for (const moduleRecord of modules) {
        const registryEntry = resolveModuleRecordType(importee, moduleRecord, {
            rootDir,
        });
        if (registryEntry) {
            return registryEntry;
        }
    }
    throw new errors_1.NoLwcModuleFound(importee, dirname);
}
exports.resolveModule = resolveModule;
//# sourceMappingURL=resolve-module.js.map