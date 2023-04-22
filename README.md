# @lukethacoder/lwc-module-loader

An opinionated edit to the @lwc/module-loader package

> based on the [`@lwc/module-resolver`](https://github.com/salesforce/lwc/blob/master/packages/%40lwc/module-resolver/README.md) package.

### Key Edits

#### Custom Namespace Directories

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

This example shows how you can assign the `c` namespace to the default salesforce LWC folder, whilst still keeping the standard config for folder based namespacing. It also showcases using the `ui` namespace with the multi-directory config enhancement.


// TODO:
- [ ] How to use with the standard open sourced LWC base project setup