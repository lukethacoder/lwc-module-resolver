/**
 * Copyright (C) 2023 salesforce.com, inc.
 */
import fs from 'fs';
import path, { isAbsolute, join } from 'path';
import resolve from 'resolve';

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
class LwcConfigError extends Error {
    constructor(message, { scope }) {
        super(`Invalid LWC configuration in "${scope}". ${message}`);
        this.code = 'LWC_CONFIG_ERROR';
        this.scope = scope;
    }
}

/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
var RegistryType;
(function (RegistryType) {
    RegistryType["alias"] = "alias";
    RegistryType["dir"] = "dir";
})(RegistryType || (RegistryType = {}));

/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
/**
 * Determines whether the given value is an object or null.
 * @param obj The value to check
 * @returns true if the value is an object or null
 * @example isObject(null) // true
 */
function isObject(obj) {
    return typeof obj === 'object';
}

/**
 * Methods that edit the core module resolution logic of the `@lwc/module-resolver` package.
 * Edits are to facilitate a more dynamic folder structure.
 *
 * To load LWCs directly (without having to have a namespace folder, e.g. if you're
 * doing on platform development), set the namespace value in your `lwc.config.json` file
 * against the directory you wish to namespace.
 *
 * This also supports multiple folders with the same namespace, again, great for on
 * platform package development.
 *
 * ```json
 * {
 *   "modules": [
 *     {
 *       "dir": "force-app/main/default/lwc",
 *       "namespace": "c"
 *     },
 *     {
 *       "dirs": [
 *          "force-app/ui-account-flow/default/lwc",
 *          "force-app/ui-shared/default/lwc"
 *        ],
 *       "namespace": "ui"
 *     }
 *   ]
 * }
 * ```
 */
/**
 * Override of the `@lwc/module-resolver` resolveModuleFromDir method
 */
function resolveModuleFromDirEdit(specifier, moduleRecord, opts) {
    const { dir, dirs } = moduleRecord;
    const { rootDir } = opts;
    // if single directory for namespace
    if (dir) {
        const absModuleDir = isAbsolute(dir) ? dir : join(rootDir, dir);
        return resolveModuleFromSingleDir(specifier, moduleRecord, absModuleDir, opts);
    }
    else if (dirs) {
        // if multiple "dirs" have been set
        const potentialModuleDirs = dirs
            .map((singleDir) => resolveModuleFromSingleDir(specifier, moduleRecord, isAbsolute(singleDir) ? singleDir : join(rootDir, singleDir), Object.assign(Object.assign({}, opts), { isCheckingMultiDir: true })))
            .filter((module) => !!module);
        if (potentialModuleDirs.length > 1) {
            throw new LwcConfigError(`Conflicting LWCs found in directories for module "${JSON.stringify(moduleRecord)}"`, { scope: JSON.stringify(dirs) });
        }
        else if (potentialModuleDirs.length === 0) {
            return undefined;
            // throw new LwcConfigError(
            //   `Invalid dirs module record "${specifier}": "${JSON.stringify(
            //     moduleRecord
            //   )}", does not exist`,
            //   { scope: JSON.stringify(dirs) }
            // )
        }
        return potentialModuleDirs[0];
    }
}
function resolveModuleFromSingleDir(specifier, moduleRecord, absModuleDir, opts) {
    const { namespace: namespaceValue } = moduleRecord;
    const { isCheckingMultiDir } = opts;
    if (!fs.existsSync(absModuleDir)) {
        // if multi dir, the LWC might be in another directory,
        // so don't throw an error here
        if (isCheckingMultiDir) {
            return;
        }
        // if its a single dir, keep the existing error
        throw new LwcConfigError(`Invalid dir module record "${JSON.stringify(moduleRecord)}", directory "${absModuleDir}" does not exist`, { scope: absModuleDir });
    }
    // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
    // We can early exit if the required specifier doesn't match.
    const parts = specifier.split('/');
    const namespace = parts[0];
    const name = parts[1];
    // check we have both a namespace and a name for the import
    if (!((namespace || namespaceValue) && name)) {
        return;
    }
    if (namespaceValue) {
        // allow diff namespaced dirs to have the same module name
        if (namespaceValue !== namespace) {
            // non-matching namespaces, no LWC here
            return;
        }
    }
    // handle both namespaced folders and namespace config
    const moduleDir = namespaceValue
        ? join(absModuleDir, name)
        : join(absModuleDir, namespace, name);
    // Exit if the expected module directory doesn't exists.
    if (!fs.existsSync(moduleDir)) {
        return;
    }
    const entry = getModuleEntry(moduleDir, name, opts);
    return createRegistryEntry(entry, specifier, RegistryType.dir, opts);
}
/**
 * Override of the `@lwc/module-resolver` normalizeConfig method
 */
function normalizeConfigEdit(config, scope) {
    const rootDir = config.rootDir ? path.resolve(config.rootDir) : process.cwd();
    const modules = config.modules || [];
    const normalizedModules = modules.map((m) => {
        if (!isObject(m)) {
            throw new LwcConfigError(`Invalid module record. Module record must be an object, instead got ${JSON.stringify(m)}.`, { scope });
        }
        return isDirModuleRecordEdit(m)
            ? Object.assign(Object.assign(Object.assign({}, m), (m.dir ? { dir: path.resolve(rootDir, m.dir) } : {})), (m.dirs ? { dirs: m.dirs.map(singleDir => path.resolve(rootDir, singleDir.replace('$rootDir/', ''))) } : {})) : m;
    });
    return {
        modules: normalizedModules,
        rootDir,
    };
}
function mergeModulesEdit(userModules, configModules = []) {
    const visitedAlias = new Set();
    const visitedDirs = new Set();
    const visitedNpm = new Set();
    const modules = userModules.slice();
    // Visit the user modules to created an index with the name as keys
    userModules.forEach((m) => {
        if (isAliasModuleRecord(m)) {
            visitedAlias.add(m.name);
        }
        else if (isDirModuleRecordEdit(m)) {
            if (m.dir) {
                visitedDirs.add(normalizeDirName(m.dir));
            }
            if (m.dirs) {
                m.dirs.forEach(singleDir => {
                    visitedDirs.add(normalizeDirName(singleDir));
                });
            }
        }
        else if (isNpmModuleRecord(m)) {
            visitedNpm.add(m.npm);
        }
    });
    configModules.forEach((m) => {
        if ((isAliasModuleRecord(m) && !visitedAlias.has(m.name)) ||
            (isDirModuleRecordEdit(m) && m.dir && !visitedDirs.has(normalizeDirName(m.dir))) ||
            (isNpmModuleRecord(m) && !visitedNpm.has(m.npm))) {
            modules.push(m);
        }
    });
    return modules;
}
function isDirModuleRecordEdit(moduleRecord) {
    return 'dir' in moduleRecord || 'dirs' in moduleRecord;
}

/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
const PACKAGE_JSON = 'package.json';
const LWC_CONFIG_FILE = 'lwc.config.json';
function isNpmModuleRecord(moduleRecord) {
    return 'npm' in moduleRecord;
}
function isDirModuleRecord(moduleRecord) {
    return isDirModuleRecordEdit(moduleRecord);
}
function isAliasModuleRecord(moduleRecord) {
    return 'name' in moduleRecord && 'path' in moduleRecord;
}
function getEntry(moduleDir, moduleName, ext) {
    return path.join(moduleDir, `${moduleName}.${ext}`);
}
function getModuleEntry(moduleDir, moduleName, opts) {
    const entryJS = getEntry(moduleDir, moduleName, 'js');
    const entryTS = getEntry(moduleDir, moduleName, 'ts');
    const entryHTML = getEntry(moduleDir, moduleName, 'html');
    const entryCSS = getEntry(moduleDir, moduleName, 'css');
    // Order is important
    if (fs.existsSync(entryJS)) {
        return entryJS;
    }
    else if (fs.existsSync(entryTS)) {
        return entryTS;
    }
    else if (fs.existsSync(entryHTML)) {
        return entryHTML;
    }
    else if (fs.existsSync(entryCSS)) {
        return entryCSS;
    }
    throw new LwcConfigError(`Unable to find a valid entry point for "${moduleDir}/${moduleName}"`, { scope: opts.rootDir });
}
function normalizeConfig(config, scope) {
    return normalizeConfigEdit(config, scope);
}
function normalizeDirName(dirName) {
    return dirName.endsWith('/') ? dirName : `${dirName}/`;
}
// User defined modules will have precedence over the ones defined elsewhere (ex. npm)
function mergeModules(userModules, configModules = []) {
    return mergeModulesEdit(userModules, configModules);
}
function findFirstUpwardConfigPath(dirname) {
    const parts = dirname.split(path.sep);
    while (parts.length > 1) {
        const upwardsPath = parts.join(path.sep);
        const pkgJsonPath = path.join(upwardsPath, PACKAGE_JSON);
        const configJsonPath = path.join(upwardsPath, LWC_CONFIG_FILE);
        const dirHasPkgJson = fs.existsSync(pkgJsonPath);
        const dirHasLwcConfig = fs.existsSync(configJsonPath);
        if (dirHasLwcConfig && !dirHasPkgJson) {
            throw new LwcConfigError(`"lwc.config.json" must be at the package root level along with the "package.json"`, { scope: upwardsPath });
        }
        if (dirHasPkgJson) {
            return path.dirname(pkgJsonPath);
        }
        parts.pop();
    }
    throw new LwcConfigError(`Unable to find any LWC configuration file`, {
        scope: dirname,
    });
}
function validateNpmConfig(config, opts) {
    if (!config.modules) {
        throw new LwcConfigError('Missing "modules" property for a npm config', {
            scope: opts.rootDir,
        });
    }
    if (!config.expose) {
        throw new LwcConfigError('Missing "expose" attribute: An imported npm package must explicitly define all the modules that it contains', { scope: opts.rootDir });
    }
}
function validateNpmAlias(exposed, map, opts) {
    Object.keys(map).forEach((specifier) => {
        if (!exposed.includes(specifier)) {
            throw new LwcConfigError(`Unable to apply mapping: The specifier "${specifier}" is not exposed by the npm module`, { scope: opts.rootDir });
        }
    });
}
function getLwcConfig(dirname) {
    var _a;
    const packageJsonPath = path.resolve(dirname, PACKAGE_JSON);
    const lwcConfigPath = path.resolve(dirname, LWC_CONFIG_FILE);
    if (fs.existsSync(lwcConfigPath)) {
        return require(lwcConfigPath);
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return (_a = require(packageJsonPath).lwc) !== null && _a !== void 0 ? _a : {};
    }
}
function createRegistryEntry(entry, specifier, type, opts) {
    return {
        entry,
        specifier,
        type,
        scope: opts.rootDir,
    };
}
function remapList(exposed, map) {
    return exposed.reduce((renamed, item) => {
        renamed.push(map[item] || item);
        return renamed;
    }, []);
}
function transposeObject(map) {
    return Object.entries(map).reduce((r, [key, value]) => ((r[value] = key), r), {});
}

/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
function resolveModuleFromAlias(specifier, moduleRecord, opts) {
    const { name, path: modulePath } = moduleRecord;
    if (specifier !== name) {
        return;
    }
    const entry = path.resolve(opts.rootDir, modulePath);
    if (!fs.existsSync(entry)) {
        throw new LwcConfigError(`Invalid alias module record "${JSON.stringify(moduleRecord)}", file "${entry}" does not exist`, { scope: opts.rootDir });
    }
    return createRegistryEntry(entry, specifier, RegistryType.alias, opts);
}
function resolveModuleFromDir(specifier, moduleRecord, opts) {
    return resolveModuleFromDirEdit(specifier, moduleRecord, opts);
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
            throw new LwcConfigError(`Invalid npm module record "${JSON.stringify(npmModuleRecord)}", "${npm}" npm module can't be resolved`, { scope: opts.rootDir });
        }
        throw error;
    }
    const packageDir = path.dirname(pkgJsonPath);
    const lwcConfig = getLwcConfig(packageDir);
    validateNpmConfig(lwcConfig, { rootDir: packageDir });
    let exposedModules = lwcConfig.expose;
    let reverseMapping;
    if (aliasMapping) {
        validateNpmAlias(lwcConfig.expose, aliasMapping, { rootDir: packageDir });
        exposedModules = remapList(lwcConfig.expose, aliasMapping);
        reverseMapping = transposeObject(aliasMapping);
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
                    registryEntry.type = RegistryType.alias;
                }
                return registryEntry;
            }
        }
        throw new LwcConfigError(`Unable to find "${specifier}" under npm package "${npmModuleRecord.npm}"`, { scope: packageDir });
    }
}
function resolveModuleRecordType(specifier, moduleRecord, opts) {
    const { rootDir } = opts;
    if (isAliasModuleRecord(moduleRecord)) {
        return resolveModuleFromAlias(specifier, moduleRecord, { rootDir });
    }
    else if (isDirModuleRecord(moduleRecord)) {
        return resolveModuleFromDir(specifier, moduleRecord, { rootDir });
    }
    else if (isNpmModuleRecord(moduleRecord)) {
        return resolveModuleFromNpm(specifier, moduleRecord, opts);
    }
    throw new LwcConfigError(`Unknown module record "${JSON.stringify(moduleRecord, undefined, 2)}"`, {
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
    const rootDir = findFirstUpwardConfigPath(path.resolve(dirname));
    const lwcConfig = getLwcConfig(rootDir);
    let modules = lwcConfig.modules || [];
    if (config) {
        const userConfig = normalizeConfig(config, rootDir);
        modules = mergeModules(userConfig.modules, modules);
    }
    for (const moduleRecord of modules) {
        const registryEntry = resolveModuleRecordType(importee, moduleRecord, {
            rootDir,
        });
        if (registryEntry) {
            return registryEntry;
        }
    }
    throw new NoLwcModuleFound(importee, dirname);
}

export { RegistryType, resolveModule };
/** version: 6.5.0 */
//# sourceMappingURL=index.js.map
