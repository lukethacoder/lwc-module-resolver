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
import { RegistryEntry, DirModuleRecord, ModuleResolverConfig, ModuleRecord } from './types';
/**
 * Override of the `@lwc/module-resolver` resolveModuleFromDir method
 */
export declare function resolveModuleFromDirEdit(specifier: string, moduleRecord: DirModuleRecord, opts: any): RegistryEntry | undefined;
/**
 * Override of the `@lwc/module-resolver` normalizeConfig method
 */
export declare function normalizeConfigEdit(config: Partial<ModuleResolverConfig>, scope: string): ModuleResolverConfig;
export declare function mergeModulesEdit(userModules: ModuleRecord[], configModules?: ModuleRecord[]): ModuleRecord[];
export declare function isDirModuleRecordEdit(moduleRecord: ModuleRecord): moduleRecord is DirModuleRecord;
