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
 *       "namespace": "c"
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
import { IS_DEBUG } from './utils'

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
  const { dir, namespace: namespaceConfig } = moduleRecord
  IS_DEBUG && console.log('\n📦 resolveModuleFromDirEdit ')
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

  IS_DEBUG && console.log('   rootDir ', rootDir)
  IS_DEBUG && console.log('   dir ', dir)
  IS_DEBUG && console.log('   specifier ', specifier)

  // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
  // We can early exit if the required specifier doesn't match.
  const parts = specifier.split('/')
  const namespace = parts[0]
  const name = parts[1]

  IS_DEBUG && console.log(`   { namespace, name} `, { namespace, name })

  // check we have both a namespace and a name for the import
  if (!((namespace || namespaceConfig) && name)) {
    return
  }

  IS_DEBUG && console.log('   namespaceConfig ', namespaceConfig)
  IS_DEBUG && console.log('   absModuleDir ', absModuleDir)
  // handle both namespaced folders and namespace config
  const moduleDir = namespaceConfig
    ? join(absModuleDir, name)
    : join(absModuleDir, namespace, name)
  IS_DEBUG && console.log('   moduleDir ', moduleDir)

  // Exit if the expected module directory doesn't exists.
  if (!fs.existsSync(moduleDir)) {
    console.warn(
      `${moduleDir}: Module does not exist ${
        namespace || namespaceConfig
      }/${name}`
    )
    return
  }

  const entry = getModuleEntry(moduleDir, name, opts)
  return createRegistryEntry(entry, specifier, RegistryType.dir, opts)
}
