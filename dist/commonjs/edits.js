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
/**
 * Override of the `@lwc/module-loader` resolveModuleFromDir method
 * @param specifier
 * @param moduleRecord
 * @param opts
 * @returns
 */
function resolveModuleFromDirEdit(specifier, moduleRecord, opts) {
    const { dir } = moduleRecord;
    const { rootDir } = opts;
    console.log('resolveModuleFromDirEdit dir ', dir);
    const absModuleDir = (0, path_1.isAbsolute)(dir) ? dir : (0, path_1.join)(rootDir, dir);
    console.log('resolveModuleFromDirEdit absModuleDir ', absModuleDir);
    if (!fs_1.default.existsSync(absModuleDir)) {
        throw new Error(`Invalid dir module record "${JSON.stringify(moduleRecord)}", directory ${absModuleDir} doesn't exists`);
    }
    // TODO: check the config file for namespace values, else assume the parent folder is the namespace
    specifier = 'c/lwcCard';
    // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
    // We can early exit if the required specifier doesn't match.
    const parts = specifier.split('/');
    // console.log('resolveModuleFromDirEdit parts ', parts)
    // if (parts.length !== 2) {
    //   return
    // }
    const [ns, name] = parts;
    console.log('resolveModuleFromDirEdit ns ', ns);
    console.log('resolveModuleFromDirEdit name ', name);
    const moduleDir = (0, path_1.join)(absModuleDir, name);
    console.log('resolveModuleFromDirEdit moduleDir ', moduleDir);
    // Exit if the expected module directory doesn't exists.
    if (!fs_1.default.existsSync(moduleDir)) {
        return;
    }
    const entry = (0, utils_1.getModuleEntry)(moduleDir, name, opts);
    console.log('resolveModuleFromDirEdit entry ', entry);
    return (0, utils_1.createRegistryEntry)(entry, specifier, types_1.RegistryType.dir, opts);
}
exports.resolveModuleFromDirEdit = resolveModuleFromDirEdit;
//# sourceMappingURL=edits.js.map