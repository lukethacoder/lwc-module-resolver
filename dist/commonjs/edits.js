"use strict";
/**
 * Methods that edit the core module resolution logic of the `@lwc/module-loader` package.
 * Edits are to facilitate a more dynamic folder structure (not have to be namespaced)
 *
 * To load LWCs directly (without having to have a namespace folder, e.g. if you're
 * doing on platform development), set the namespace value in your `lwc.config.json` file
 * against the directory you wish to namespace.
 *
 * ```json
 * {
 *   "modules": [
 *     {
 *       "dir": "force-app/main/default/lwc",
 *       "name": "c"
 *     }
 *   ]
 * }
 * ```
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveModuleFromDirEdit = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = require("path");
const types_1 = require("./types");
const utils_1 = require("./utils");
const errors_1 = require("./errors");
const PACKAGE_NAME = '📦 @lukethacoder/lwc-module-resolver';
/**
 * Override of the `@lwc/module-loader` resolveModuleFromDir method
 * @param specifier
 * @param moduleRecord
 * @param opts
 * @returns
 */
function resolveModuleFromDirEdit(specifier, moduleRecord, opts) {
    const { dir, namespace } = moduleRecord;
    const { rootDir } = opts;
    const absModuleDir = (0, path_1.isAbsolute)(dir) ? dir : (0, path_1.join)(rootDir, dir);
    if (!fs_1.default.existsSync(absModuleDir)) {
        throw new errors_1.LwcConfigError(`Invalid dir module record "${JSON.stringify(moduleRecord)}", directory "${absModuleDir}" does not exist`, { scope: absModuleDir });
    }
    // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
    // We can early exit if the required specifier doesn't match.
    let parts = specifier.split('/');
    if (parts.length !== 2) {
        // check if namespace has been manually set here
        if (!namespace) {
            return;
        }
    }
    const [ns, name] = parts;
    // TODO: handle namespaced folders too
    const moduleDir = namespace
        ? (0, path_1.join)(absModuleDir, name)
        : (0, path_1.join)(absModuleDir, ns, name);
    // Exit if the expected module directory doesn't exists.
    if (!fs_1.default.existsSync(moduleDir)) {
        console.warn(`: Module does not exist ${ns}/${name}`);
        return;
    }
    const entry = (0, utils_1.getModuleEntry)(moduleDir, name, opts);
    return (0, utils_1.createRegistryEntry)(entry, specifier, types_1.RegistryType.dir, opts);
}
exports.resolveModuleFromDirEdit = resolveModuleFromDirEdit;
//# sourceMappingURL=edits.js.map