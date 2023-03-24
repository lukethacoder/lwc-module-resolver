# @lukethacoder/lwc-module-loader

An opinionated edit to the @lwc/module-loader package

> based on the [`@lwc/module-resolver`](https://github.com/salesforce/lwc/blob/master/packages/%40lwc/module-resolver/README.md) package.

### Key Edits

#### Custom Namespace Directories

Instead of assuming the namespace based on the folder structure, you can declaritavely set namespaces to directories. Automatic namespacing is still enabled, and can be a mix and match config as needed. 

The primary driver for this is the on platform folder structure conflicting with the standard open source folder structure.

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
