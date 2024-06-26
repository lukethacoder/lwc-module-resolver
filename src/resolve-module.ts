/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

import fs from 'fs'
import path from 'path'
import resolve from 'resolve'

import {
  createRegistryEntry,
  findFirstUpwardConfigPath,
  isAliasModuleRecord,
  isDirModuleRecord,
  isNpmModuleRecord,
  getLwcConfig,
  normalizeConfig,
  validateNpmConfig,
  mergeModules,
  remapList,
  transposeObject,
  validateNpmAlias,
} from './utils'
import { NoLwcModuleFound, LwcConfigError } from './errors'

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

// override methods
import { resolveModuleFromDirEdit } from './edits'

function resolveModuleFromAlias(
  specifier: string,
  moduleRecord: AliasModuleRecord,
  opts: InnerResolverOptions
): RegistryEntry | undefined {
  const { name, path: modulePath } = moduleRecord

  if (specifier !== name) {
    return
  }

  const entry = path.resolve(opts.rootDir, modulePath)
  if (!fs.existsSync(entry)) {
    throw new LwcConfigError(
      `Invalid alias module record "${JSON.stringify(
        moduleRecord
      )}", file "${entry}" does not exist`,
      { scope: opts.rootDir }
    )
  }

  return createRegistryEntry(entry, specifier, RegistryType.alias, opts)
}

function resolveModuleFromDir(
  specifier: string,
  moduleRecord: DirModuleRecord,
  opts: InnerResolverOptions
): RegistryEntry | undefined {
  return resolveModuleFromDirEdit(specifier, moduleRecord, opts)
}

function resolveModuleFromNpm(
  specifier: string,
  npmModuleRecord: NpmModuleRecord,
  opts: InnerResolverOptions
): RegistryEntry | undefined {
  const { npm, map: aliasMapping } = npmModuleRecord

  let pkgJsonPath
  try {
    pkgJsonPath = resolve.sync(`${npm}/package.json`, {
      basedir: opts.rootDir,
      preserveSymlinks: true,
    })
  } catch (error: any) {
    // If the module "package.json" can't be found, throw an an invalid config error. Otherwise
    // rethrow the original error.
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new LwcConfigError(
        `Invalid npm module record "${JSON.stringify(
          npmModuleRecord
        )}", "${npm}" npm module can't be resolved`,
        { scope: opts.rootDir }
      )
    }

    throw error
  }

  const packageDir = path.dirname(pkgJsonPath)
  const lwcConfig = getLwcConfig(packageDir)

  validateNpmConfig(lwcConfig, { rootDir: packageDir })
  let exposedModules = lwcConfig.expose
  let reverseMapping

  if (aliasMapping) {
    validateNpmAlias(lwcConfig.expose, aliasMapping, { rootDir: packageDir })
    exposedModules = remapList(lwcConfig.expose, aliasMapping)
    reverseMapping = transposeObject(aliasMapping)
  }

  if (exposedModules.includes(specifier)) {
    for (const moduleRecord of lwcConfig.modules) {
      const aliasedSpecifier = reverseMapping && reverseMapping[specifier]
      const registryEntry = resolveModuleRecordType(
        aliasedSpecifier || specifier,
        moduleRecord,
        {
          rootDir: packageDir,
        }
      )

      if (registryEntry) {
        if (aliasedSpecifier) {
          registryEntry.specifier = specifier
          registryEntry.type = RegistryType.alias
        }
        return registryEntry
      }
    }

    throw new LwcConfigError(
      `Unable to find "${specifier}" under npm package "${npmModuleRecord.npm}"`,
      { scope: packageDir }
    )
  }
}

function resolveModuleRecordType(
  specifier: string,
  moduleRecord: ModuleRecord,
  opts: InnerResolverOptions
): RegistryEntry | undefined {
  const { rootDir } = opts

  if (isAliasModuleRecord(moduleRecord)) {
    return resolveModuleFromAlias(specifier, moduleRecord, { rootDir })
  } else if (isDirModuleRecord(moduleRecord)) {
    return resolveModuleFromDir(specifier, moduleRecord, { rootDir })
  } else if (isNpmModuleRecord(moduleRecord)) {
    return resolveModuleFromNpm(specifier, moduleRecord, opts)
  }

  throw new LwcConfigError(
    `Unknown module record "${JSON.stringify(moduleRecord, undefined, 2)}"`,
    {
      scope: rootDir,
    }
  )
}

export function resolveModule(
  importee: string,
  dirname: string,
  config?: Partial<ModuleResolverConfig>
): RegistryEntry {
  if (typeof importee !== 'string') {
    throw new TypeError(
      `The importee argument must be a string. Received type ${typeof importee}`
    )
  }

  if (typeof dirname !== 'string') {
    throw new TypeError(
      `The dirname argument must be a string. Received type ${typeof dirname}`
    )
  }

  if (importee.startsWith('.') || importee.startsWith('/')) {
    throw new TypeError(
      `The importee argument must be a valid LWC module name. Received "${importee}"`
    )
  }

  const rootDir = findFirstUpwardConfigPath(path.resolve(dirname))
  const lwcConfig = getLwcConfig(rootDir)

  let modules = lwcConfig.modules || []
  if (config) {
    const userConfig = normalizeConfig(config, rootDir)
    modules = mergeModules(userConfig.modules, modules)
  }

  for (const moduleRecord of modules) {
    const registryEntry = resolveModuleRecordType(importee, moduleRecord, {
      rootDir,
    })
    if (registryEntry) {
      return registryEntry
    }
  }

  throw new NoLwcModuleFound(importee, dirname)
}
