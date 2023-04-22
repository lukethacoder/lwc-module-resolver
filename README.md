# @lukethacoder/lwc-module-loader

⚡ An opinionated edit to the [`@lwc/module-resolver`](https://github.com/salesforce/lwc/blob/master/packages/%40lwc/module-resolver/README.md)  package to add support for namespaces and multi directory modules

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

### TODO:
- [ ] How to use with the standard open sourced LWC base project setup
