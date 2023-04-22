"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDirModuleRecordEdit = exports.mergeModulesEdit = exports.normalizeConfigEdit = exports.resolveModuleFromDirEdit = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const path_2 = require("path");
const types_1 = require("./types");
const utils_1 = require("./utils");
const errors_1 = require("./errors");
const shared_1 = require("./shared");
/**
 * Override of the `@lwc/module-resolver` resolveModuleFromDir method
 */
function resolveModuleFromDirEdit(specifier, moduleRecord, opts) {
    const { dir, dirs, namespace: namespaceConfig } = moduleRecord;
    const { rootDir } = opts;
    // if single directory for namespace
    if (dir) {
        const absModuleDir = (0, path_2.isAbsolute)(dir) ? dir : (0, path_2.join)(rootDir, dir);
        return resolveModuleFromSingleDir(specifier, moduleRecord, absModuleDir, opts);
    }
    else if (dirs) {
        // if multiple "dirs" have been set    
        const potentialModuleDirs = dirs.map(singleDir => resolveModuleFromSingleDir(specifier, moduleRecord, (0, path_2.isAbsolute)(singleDir) ? singleDir : (0, path_2.join)(rootDir, singleDir), {
            ...opts,
            isCheckingMultiDir: true
        })).filter(module => !!module);
        if (potentialModuleDirs.length > 1) {
            throw new errors_1.LwcConfigError(`Conflicting LWCs found in directories for module "${JSON.stringify(moduleRecord)}"`, { scope: JSON.stringify(dirs) });
        }
        else if (potentialModuleDirs.length === 0) {
            throw new errors_1.LwcConfigError(`Invalid dirs module record "${JSON.stringify(moduleRecord)}", does not exist`, { scope: JSON.stringify(dirs) });
        }
        return potentialModuleDirs[0];
    }
}
exports.resolveModuleFromDirEdit = resolveModuleFromDirEdit;
function resolveModuleFromSingleDir(specifier, moduleRecord, absModuleDir, opts) {
    const { namespace: namespaceConfig } = moduleRecord;
    const { isCheckingMultiDir } = opts;
    if (!fs_1.default.existsSync(absModuleDir)) {
        // if multi dir, the LWC might be in another directory,
        // so don't throw an error here
        if (isCheckingMultiDir) {
            console.warn(`Unable to find ${specifier} in dir of ${absModuleDir}`);
            return;
        }
        // if its a single dir, keep the existing error
        throw new errors_1.LwcConfigError(`Invalid dir module record "${JSON.stringify(moduleRecord)}", directory "${absModuleDir}" does not exist`, { scope: absModuleDir });
    }
    // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
    // We can early exit if the required specifier doesn't match.
    const parts = specifier.split('/');
    const namespace = parts[0];
    const name = parts[1];
    // check we have both a namespace and a name for the import
    if (!((namespace || namespaceConfig) && name)) {
        return;
    }
    // handle both namespaced folders and namespace config
    const moduleDir = namespaceConfig
        ? (0, path_2.join)(absModuleDir, name)
        : (0, path_2.join)(absModuleDir, namespace, name);
    // Exit if the expected module directory doesn't exists.
    if (!fs_1.default.existsSync(moduleDir)) {
        utils_1.IS_DEBUG && console.warn(`${moduleDir}: Module does not exist ${namespace || namespaceConfig}/${name}`);
        return;
    }
    const entry = (0, utils_1.getModuleEntry)(moduleDir, name, opts);
    return (0, utils_1.createRegistryEntry)(entry, specifier, types_1.RegistryType.dir, opts);
}
/**
 * Override of the `@lwc/module-resolver` normalizeConfig method
 */
function normalizeConfigEdit(config, scope) {
    const rootDir = config.rootDir ? path_1.default.resolve(config.rootDir) : process.cwd();
    const modules = config.modules || [];
    const normalizedModules = modules.map((m) => {
        if (!(0, shared_1.isObject)(m)) {
            throw new errors_1.LwcConfigError(`Invalid module record. Module record must be an object, instead got ${JSON.stringify(m)}.`, { scope });
        }
        return isDirModuleRecordEdit(m)
            ? {
                ...m,
                dir: m.dir ? path_1.default.resolve(rootDir, m.dir) : '',
                dirs: m.dirs ? m.dirs.map(singleDir => path_1.default.resolve(rootDir, singleDir.replace('$rootDir/', ''))) : [],
            }
            : m;
    });
    return {
        modules: normalizedModules,
        rootDir,
    };
}
exports.normalizeConfigEdit = normalizeConfigEdit;
function mergeModulesEdit(userModules, configModules = []) {
    const visitedAlias = new Set();
    const visitedDirs = new Set();
    const visitedNpm = new Set();
    const modules = userModules.slice();
    // Visit the user modules to created an index with the name as keys
    userModules.forEach((m) => {
        if ((0, utils_1.isAliasModuleRecord)(m)) {
            visitedAlias.add(m.name);
        }
        else if (isDirModuleRecordEdit(m)) {
            if (m.dir) {
                visitedDirs.add((0, utils_1.normalizeDirName)(m.dir));
            }
            if (m.dirs) {
                m.dirs.forEach(singleDir => {
                    visitedDirs.add((0, utils_1.normalizeDirName)(singleDir));
                });
            }
        }
        else if ((0, utils_1.isNpmModuleRecord)(m)) {
            visitedNpm.add(m.npm);
        }
    });
    configModules.forEach((m) => {
        if (((0, utils_1.isAliasModuleRecord)(m) && !visitedAlias.has(m.name)) ||
            (isDirModuleRecordEdit(m) && m.dir && !visitedDirs.has((0, utils_1.normalizeDirName)(m.dir))) ||
            ((0, utils_1.isNpmModuleRecord)(m) && !visitedNpm.has(m.npm))) {
            modules.push(m);
        }
    });
    return modules;
}
exports.mergeModulesEdit = mergeModulesEdit;
function isDirModuleRecordEdit(moduleRecord) {
    return 'dir' in moduleRecord || 'dirs' in moduleRecord;
}
exports.isDirModuleRecordEdit = isDirModuleRecordEdit;
//# sourceMappingURL=edits.js.map