"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transposeObject = exports.remapList = exports.createRegistryEntry = exports.getLwcConfig = exports.validateNpmAlias = exports.validateNpmConfig = exports.findFirstUpwardConfigPath = exports.mergeModules = exports.normalizeDirName = exports.normalizeConfig = exports.getModuleEntry = exports.isAliasModuleRecord = exports.isDirModuleRecord = exports.isNpmModuleRecord = exports.IS_DEBUG = void 0;
/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errors_1 = require("./errors");
const edits_1 = require("./edits");
exports.IS_DEBUG = false;
const PACKAGE_JSON = 'package.json';
const LWC_CONFIG_FILE = 'lwc.config.json';
function isNpmModuleRecord(moduleRecord) {
    return 'npm' in moduleRecord;
}
exports.isNpmModuleRecord = isNpmModuleRecord;
function isDirModuleRecord(moduleRecord) {
    return (0, edits_1.isDirModuleRecordEdit)(moduleRecord);
}
exports.isDirModuleRecord = isDirModuleRecord;
function isAliasModuleRecord(moduleRecord) {
    return 'name' in moduleRecord && 'path' in moduleRecord;
}
exports.isAliasModuleRecord = isAliasModuleRecord;
function getEntry(moduleDir, moduleName, ext) {
    return path_1.default.join(moduleDir, `${moduleName}.${ext}`);
}
function getModuleEntry(moduleDir, moduleName, opts) {
    const entryJS = getEntry(moduleDir, moduleName, 'js');
    const entryTS = getEntry(moduleDir, moduleName, 'ts');
    const entryHTML = getEntry(moduleDir, moduleName, 'html');
    const entryCSS = getEntry(moduleDir, moduleName, 'css');
    // Order is important
    if (fs_1.default.existsSync(entryJS)) {
        return entryJS;
    }
    else if (fs_1.default.existsSync(entryTS)) {
        return entryTS;
    }
    else if (fs_1.default.existsSync(entryHTML)) {
        return entryHTML;
    }
    else if (fs_1.default.existsSync(entryCSS)) {
        return entryCSS;
    }
    throw new errors_1.LwcConfigError(`Unable to find a valid entry point for "${moduleDir}/${moduleName}"`, { scope: opts.rootDir });
}
exports.getModuleEntry = getModuleEntry;
function normalizeConfig(config, scope) {
    return (0, edits_1.normalizeConfigEdit)(config, scope);
}
exports.normalizeConfig = normalizeConfig;
function normalizeDirName(dirName) {
    return dirName.endsWith('/') ? dirName : `${dirName}/`;
}
exports.normalizeDirName = normalizeDirName;
// User defined modules will have precedence over the ones defined elsewhere (ex. npm)
function mergeModules(userModules, configModules = []) {
    return (0, edits_1.mergeModulesEdit)(userModules, configModules);
}
exports.mergeModules = mergeModules;
function findFirstUpwardConfigPath(dirname) {
    const parts = dirname.split(path_1.default.sep);
    while (parts.length > 1) {
        const upwardsPath = parts.join(path_1.default.sep);
        const pkgJsonPath = path_1.default.join(upwardsPath, PACKAGE_JSON);
        const configJsonPath = path_1.default.join(upwardsPath, LWC_CONFIG_FILE);
        const dirHasPkgJson = fs_1.default.existsSync(pkgJsonPath);
        const dirHasLwcConfig = fs_1.default.existsSync(configJsonPath);
        if (dirHasLwcConfig && !dirHasPkgJson) {
            throw new errors_1.LwcConfigError(`"lwc.config.json" must be at the package root level along with the "package.json"`, { scope: upwardsPath });
        }
        if (dirHasPkgJson) {
            return path_1.default.dirname(pkgJsonPath);
        }
        parts.pop();
    }
    throw new errors_1.LwcConfigError(`Unable to find any LWC configuration file`, {
        scope: dirname,
    });
}
exports.findFirstUpwardConfigPath = findFirstUpwardConfigPath;
function validateNpmConfig(config, opts) {
    if (!config.modules) {
        throw new errors_1.LwcConfigError('Missing "modules" property for a npm config', {
            scope: opts.rootDir,
        });
    }
    if (!config.expose) {
        throw new errors_1.LwcConfigError('Missing "expose" attribute: An imported npm package must explicitly define all the modules that it contains', { scope: opts.rootDir });
    }
}
exports.validateNpmConfig = validateNpmConfig;
function validateNpmAlias(exposed, map, opts) {
    Object.keys(map).forEach((specifier) => {
        if (!exposed.includes(specifier)) {
            throw new errors_1.LwcConfigError(`Unable to apply mapping: The specifier "${specifier}" is not exposed by the npm module`, { scope: opts.rootDir });
        }
    });
}
exports.validateNpmAlias = validateNpmAlias;
function getLwcConfig(dirname) {
    var _a;
    const packageJsonPath = path_1.default.resolve(dirname, PACKAGE_JSON);
    const lwcConfigPath = path_1.default.resolve(dirname, LWC_CONFIG_FILE);
    if (fs_1.default.existsSync(lwcConfigPath)) {
        return require(lwcConfigPath);
    }
    else {
        return (_a = require(packageJsonPath).lwc) !== null && _a !== void 0 ? _a : {};
    }
}
exports.getLwcConfig = getLwcConfig;
function createRegistryEntry(entry, specifier, type, opts) {
    return {
        entry,
        specifier,
        type,
        scope: opts.rootDir,
    };
}
exports.createRegistryEntry = createRegistryEntry;
function remapList(exposed, map) {
    return exposed.reduce((renamed, item) => {
        renamed.push(map[item] || item);
        return renamed;
    }, []);
}
exports.remapList = remapList;
function transposeObject(map) {
    return Object.entries(map).reduce((r, [key, value]) => ((r[value] = key), r), {});
}
exports.transposeObject = transposeObject;
//# sourceMappingURL=utils.js.map