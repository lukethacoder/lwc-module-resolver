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

import fs from 'fs'
import path from 'path'
import { isAbsolute, join } from 'path'

import { RegistryEntry, DirModuleRecord, RegistryType, ModuleResolverConfig, ModuleRecord } from './types'
import { IS_DEBUG, createRegistryEntry, getModuleEntry, isAliasModuleRecord, isNpmModuleRecord, normalizeDirName } from './utils'
import { LwcConfigError } from './errors'
import { isObject } from './shared'

/**
 * Override of the `@lwc/module-resolver` resolveModuleFromDir method
 */
export function resolveModuleFromDirEdit(
  specifier: string,
  moduleRecord: DirModuleRecord,
  opts: any
): RegistryEntry | undefined {
  const { dir, dirs, namespace: namespaceConfig } = moduleRecord
  const { rootDir } = opts
  
  // if single directory for namespace
  if (dir) {
    const absModuleDir = isAbsolute(dir) ? dir : join(rootDir, dir)
    return resolveModuleFromSingleDir(specifier, moduleRecord, absModuleDir, opts)    
  } else if (dirs) {
    // if multiple "dirs" have been set
    const potentialModuleDirs = dirs.map(singleDir => resolveModuleFromSingleDir(
      specifier,
      moduleRecord,
      isAbsolute(singleDir) ? singleDir : join(rootDir, singleDir),
      {
        ...opts,
        isCheckingMultiDir: true
      }
    )).filter(module => !!module)

    if (potentialModuleDirs.length > 1) {
      throw new LwcConfigError(
        `Conflicting LWCs found in directories for module "${JSON.stringify(
          moduleRecord
        )}"`,
        { scope: JSON.stringify(dirs) }
      )
    } else if (potentialModuleDirs.length === 0) {
      if (specifier !== 'lwc') {
        IS_DEBUG && console.warn(`Invalid dirs module record "${specifier}": ${JSON.stringify(moduleRecord)}, does not exist`)
      }
      
      return undefined
      // throw new LwcConfigError(
      //   `Invalid dirs module record "${specifier}": "${JSON.stringify(
      //     moduleRecord
      //   )}", does not exist`,
      //   { scope: JSON.stringify(dirs) }
      // )
    }

    return potentialModuleDirs[0]
  }
}

function resolveModuleFromSingleDir(
  specifier: string,
  moduleRecord: DirModuleRecord,
  absModuleDir: string,
  opts: any
): RegistryEntry | undefined {
  const { namespace: namespaceConfig } = moduleRecord
  const { isCheckingMultiDir } = opts

  if (!fs.existsSync(absModuleDir)) {
    // if multi dir, the LWC might be in another directory,
    // so don't throw an error here
    if (isCheckingMultiDir) {
      IS_DEBUG && console.warn(`Unable to find ${specifier} in dir of ${absModuleDir}`)
      return
    }
    
    // if its a single dir, keep the existing error
    throw new LwcConfigError(
      `Invalid dir module record "${JSON.stringify(
        moduleRecord
      )}", directory "${absModuleDir}" does not exist`,
      { scope: absModuleDir }
    )
  }

  // A module dir record can only resolve module specifier with the following form "[ns]/[name]".
  // We can early exit if the required specifier doesn't match.
  const parts = specifier.split('/')
  const namespace = parts[0]
  const name = parts[1]

  // check we have both a namespace and a name for the import
  if (!((namespace || namespaceConfig) && name)) {
    return
  }

  // handle both namespaced folders and namespace config
  const moduleDir = namespaceConfig
    ? join(absModuleDir, name)
    : join(absModuleDir, namespace, name)

  // Exit if the expected module directory doesn't exists.
  if (!fs.existsSync(moduleDir)) {
    IS_DEBUG && console.warn(
      `${moduleDir}: Module does not exist ${
        namespace || namespaceConfig
      }/${name}`
    )
    return
  }

  const entry = getModuleEntry(moduleDir, name, opts)
  return createRegistryEntry(entry, specifier, RegistryType.dir, opts)
}

/**
 * Override of the `@lwc/module-resolver` normalizeConfig method
 */
export function normalizeConfigEdit(
  config: Partial<ModuleResolverConfig>,
  scope: string
): ModuleResolverConfig {
  const rootDir = config.rootDir ? path.resolve(config.rootDir) : process.cwd()
  const modules = config.modules || []
  const normalizedModules = modules.map((m) => {
    if (!isObject(m)) {
      throw new LwcConfigError(
        `Invalid module record. Module record must be an object, instead got ${JSON.stringify(
          m
        )}.`,
        { scope }
      )
    }

    return isDirModuleRecordEdit(m)
      ? {
          ...m,
          ...(m.dir ? { dir: path.resolve(rootDir, m.dir) } : {}),
          ...(m.dirs ? { dirs: m.dirs.map(singleDir => path.resolve(rootDir, singleDir.replace('$rootDir/', ''))) } : {}),
        }
      : m
  })

  return {
    modules: normalizedModules,
    rootDir,
  }
}

export function mergeModulesEdit(
  userModules: ModuleRecord[],
  configModules: ModuleRecord[] = []
): ModuleRecord[] {
  const visitedAlias = new Set()
  const visitedDirs = new Set()
  const visitedNpm = new Set()
  const modules = userModules.slice()

  // Visit the user modules to created an index with the name as keys
  userModules.forEach((m) => {
    if (isAliasModuleRecord(m)) {
      visitedAlias.add(m.name)
    } else if (isDirModuleRecordEdit(m)) {
      if (m.dir) {
        visitedDirs.add(normalizeDirName(m.dir))
      }
      if (m.dirs) {
        m.dirs.forEach(singleDir => {
          visitedDirs.add(normalizeDirName(singleDir))
        })
      }
    } else if (isNpmModuleRecord(m)) {
      visitedNpm.add(m.npm)
    }
  })

  configModules.forEach((m) => {
    if (
      (isAliasModuleRecord(m) && !visitedAlias.has(m.name)) ||
      (isDirModuleRecordEdit(m) && m.dir && !visitedDirs.has(normalizeDirName(m.dir))) ||
      (isNpmModuleRecord(m) && !visitedNpm.has(m.npm))
    ) {
      modules.push(m)
    }
  })

  return modules
}

export function isDirModuleRecordEdit(
  moduleRecord: ModuleRecord
): moduleRecord is DirModuleRecord {
  return 'dir' in moduleRecord || 'dirs' in moduleRecord
}
