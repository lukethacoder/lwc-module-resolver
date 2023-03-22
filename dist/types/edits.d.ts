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
import { RegistryEntry, DirModuleRecord } from './types';
/**
 * Override of the `@lwc/module-loader` resolveModuleFromDir method
 * @param specifier
 * @param moduleRecord
 * @param opts
 * @returns
 */
export declare function resolveModuleFromDirEdit(specifier: string, moduleRecord: DirModuleRecord, opts: any): RegistryEntry | undefined;
