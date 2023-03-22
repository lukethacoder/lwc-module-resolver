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

import fs from 'fs'
import { isAbsolute, join } from 'path'

import {
  RegistryEntry,
  AliasModuleRecord,
  InnerResolverOptions,
  ModuleRecord,
  DirModuleRecord,
  ModuleResolverConfig,
  NpmModuleRecord,
  RegistryType,
} from './types'
import { createRegistryEntry, getModuleEntry } from './utils'

/**
 * Override of the `@lwc/module-loader` resolveModuleFromDir method
 * @param specifier
 * @param moduleRecord
 * @param opts
 * @returns
 */
export function resolveModuleFromDirEdit(
  specifier: string,
  moduleRecord: DirModuleRecord,
  opts: any
): RegistryEntry | undefined {
  const { dir } = moduleRecord
  const { rootDir } = opts

  console.log('resolveModuleFromDirEdit dir ', dir)
  const absModuleDir = isAbsolute(dir) ? dir : join(rootDir, dir)

  console.log('resolveModuleFromDirEdit absModuleDir ', absModuleDir)

  if (!fs.existsSync(absModuleDir)) {
    throw new Error(
      `Invalid dir module record "${JSON.stringify(
        moduleRecord
      )}", directory ${absModuleDir} doesn't exists`
    )
  }

  // TODO: check the config file for namespace values, else assume the parent folder is the namespace
  specifier = 'c/lwcCard'

  // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
  // We can early exit if the required specifier doesn't match.
  const parts = specifier.split('/')
  // console.log('resolveModuleFromDirEdit parts ', parts)
  // if (parts.length !== 2) {
  //   return
  // }

  const [ns, name] = parts
  console.log('resolveModuleFromDirEdit ns ', ns)
  console.log('resolveModuleFromDirEdit name ', name)
  const moduleDir = join(absModuleDir, name)

  console.log('resolveModuleFromDirEdit moduleDir ', moduleDir)

  // Exit if the expected module directory doesn't exists.
  if (!fs.existsSync(moduleDir)) {
    return
  }

  const entry = getModuleEntry(moduleDir, name, opts)
  console.log('resolveModuleFromDirEdit entry ', entry)
  return createRegistryEntry(entry, specifier, RegistryType.dir, opts)
}
