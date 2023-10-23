/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */

/* eslint-env node */

const { readFileSync } = require('node:fs')
const path = require('node:path')
const replace = require('@rollup/plugin-replace')
const typescript = require('@rollup/plugin-typescript')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

// The assumption is that the build script for each sub-package runs in that sub-package's directory
const packageRoot = process.cwd()
const packageJson = JSON.parse(
  readFileSync(path.resolve(packageRoot, './package.json'), 'utf-8')
)
const {
  name: packageName,
  version,
  dependencies,
  peerDependencies,
} = packageJson
const banner = `/**\n * Copyright (C) 2023 salesforce.com, inc.\n */`
const footer = `/** version: ${version} */`
const { ROLLUP_WATCH: watchMode } = process.env
const formats = ['es', 'cjs']

const onwarn = ({ code, message }) => {
  if (!process.env.ROLLUP_WATCH && code !== 'CIRCULAR_DEPENDENCY') {
    throw new Error(message)
  }
}

// These plugins are used both by the main Rollup build.
function sharedPlugins() {
  const engineBrowserConfig = [
    '@lwc/engine-server',
    '@lwc/engine-dom',
  ].includes(packageName) && {
    // This is only used inside @lwc/engine-dom and @lwc/engine-server
    // Elsewhere, it _not_ be replaced, so that it can be replaced later (e.g. in @lwc/engine-core)
    'process.env.IS_BROWSER':
      packageName === '@lwc/engine-dom' ? 'true' : 'false',
  }

  return [
    typescript({
      target: 'es2017',
      tsconfig: path.join(packageRoot, 'tsconfig.json'),
      noEmitOnError: !watchMode, // in watch mode, do not exit with an error if typechecking fails
      ...(watchMode && {
        incremental: true,
        outputToFilesystem: true,
      }),
    }),
    replace({
      values: {
        ...engineBrowserConfig,
        'process.env.LWC_VERSION': JSON.stringify(version),
      },
      preventAssignment: true,
    }),
  ]
}

module.exports = {
  input: path.resolve(packageRoot, './src/index.ts'),

  output: formats.map((format) => ({
    file: `dist/index${format === 'cjs' ? '.cjs' : ''}.js`,
    sourcemap: true,
    format,
    banner,
    footer,
    exports: 'named',
    esModule: true,
  })),

  plugins: [
    nodeResolve({
      // These are the devDeps that may be inlined into the dist/ bundles
      // These include packages owned by us (LWC, observable-membrane), as well as parse5
      // and its single dependency, which are bundled because it makes it simpler to distribute
      resolveOnly: [
        /^@lwc\//,
        'observable-membrane',
        /^parse5($|\/)/,
        'entities',
        /^@parse5\/tools/,
      ],
    }),
    ...sharedPlugins(),
  ],

  onwarn,

  external: [
    ...Object.keys(dependencies || {}),
    ...Object.keys(peerDependencies || {}),
  ],
}
