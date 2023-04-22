# @lukethacoder/lwc-module-loader

⚡ An opinionated edit to the [`@lwc/module-resolver`](https://github.com/salesforce/lwc/blob/master/packages/%40lwc/module-resolver/README.md)  package to add support for namespaces and multi directory modules

## Install

```cmd
pnpm add @lukethacoder/lwc-module-loader
```

## Custom Namespace Directories

Instead of assuming the namespace based on the folder structure, you can declaratively set namespaces to directories. Automatic namespacing is still enabled. 

The primary driver for this is the on platform folder structure conflicting with the standard open source folder structure.

Multiple directory per namespace is also supported. This is great for package developers who wish to break up their code into smaller packages but still have the benefits of a local dev server.

```json
{
  "modules": [
    {
      "dir": "src/modules"
    },
    { 
      "dir": "force-app/main/default/lwc",
      "namespace": "c" 
    }
  ]
}
```

This example shows how you can assign the `c` namespace to the default salesforce LWC folder, whilst still keeping the standard config for folder based namespacing.

## Multi Directory Namespacing

Multiple directory per namespace has also been added. This is great for package developers who wish to break up their code into smaller packages but still want to have the benefits of a local dev server.

```json
{
  "modules": [
    {
      "dir": "src/modules"
    },
    { 
      "dir": "force-app/main/default/lwc",
      "namespace": "c" 
    },
    {
      "dirs": [
        "force-app/ui-account-flow/default/lwc",
        "force-app/ui-shared/default/lwc"
      ],
      "namespace": "ui"
    }
  ]
}
```

This example shows how you can assign the `ui` namespace to multiple source folders, whilst still keeping the standard config for folder based namespacing.

> NOTE:
> This package aims to open up current imitations enforced by open source LWC and on-platform Salesforce development. This is done purely to make your life as a developer easier and is not intended to be used as a part of a production build. These enhancements may allow you to do things that will **NOT** work on-platform.

## Example Usage

See the [playground](./playground/README.md) folder for an example.

## Example usage with [lwc.dev](https://lwc.dev/) Project

> This assumes you've already setup a LWC project.

Lets have a quick look at how we can adjust our open source LWC project to use this package.

First, install this package

```cmd
pnpm add @lukethacoder/lwc-module-resolver
```

Next, open up your `package.json` and add the below snippet that matches your package manager. This marks the custom module resolver as a replacement for the official salesforce one.

[`pnpm`](https://pnpm.io/package_json#pnpmoverrides)
```json
{
  "pnpm": {
    "overrides": {
      "@lwc/module-resolver": "npm:@lukethacoder/lwc-module-resolver"
    }
  },
}
```
[`yarn`](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/)
```json
{
  "resolutions": {
    "@lwc/module-resolver": "@lukethacoder/lwc-module-resolver"
  }
}
```
[`npm`](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides)
```json
{
  "overrides": {
    "@lwc/module-resolver": "$@lukethacoder/lwc-module-resolver"
  }
}
```

> NOTE: you might need to run your package managers install command after adding the override config.

You are now good to go. Running your LWC dev server will now be using the custom `@lukethacoder/lwc-module-resolver` package for module loading. You can go ahead and edit your `lwc.config.json` file to include both namespaced and multi directory folders.

## Development

To get the local `pnpm` package working for development, change the overrides config and the dependencies reference in your test repo to the following:

```json
{
  "dependencies": {
    "@lukethacoder/lwc-module-resolver": "link:/PATH_TO_THIS_REPO/lwc-module-resolver",
  },
  "pnpm": {
    "overrides": {
      "@lwc/module-resolver": "$@lukethacoder/lwc-module-resolver"
    }
  }
}
```