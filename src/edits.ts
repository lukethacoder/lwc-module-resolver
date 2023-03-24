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

import { RegistryEntry, DirModuleRecord, RegistryType } from './types'
import { createRegistryEntry, getModuleEntry } from './utils'
import { LwcConfigError } from './errors'

const PACKAGE_NAME = '📦 @lukethacoder/lwc-module-resolver'

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
  const { dir, namespace } = moduleRecord
  const { rootDir } = opts

  const absModuleDir = isAbsolute(dir) ? dir : join(rootDir, dir)

  if (!fs.existsSync(absModuleDir)) {
    throw new LwcConfigError(
      `Invalid dir module record "${JSON.stringify(
        moduleRecord
      )}", directory "${absModuleDir}" does not exist`,
      { scope: absModuleDir }
    )
  }

  // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
  // We can early exit if the required specifier doesn't match.
  let parts = specifier.split('/')
  if (parts.length !== 2) {
    // check if namespace has been manually set here
    if (!namespace) {
      return
    }
  }

  const [ns, name] = parts

  // TODO: handle namespaced folders too
  const moduleDir = namespace
    ? join(absModuleDir, name)
    : join(absModuleDir, ns, name)

  // Exit if the expected module directory doesn't exists.
  if (!fs.existsSync(moduleDir)) {
    console.warn(`: Module does not exist ${ns}/${name}`)
    return
  }

  const entry = getModuleEntry(moduleDir, name, opts)
  return createRegistryEntry(entry, specifier, RegistryType.dir, opts)
}
