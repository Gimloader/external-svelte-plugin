# @gimloader/external-svelte-plugin

A plugin for the Gimloader [build tools](https://github.com/Gimloader/build) which makes scripts automatically use Gimloader's exposed Svelte exports, cutting down script size by 1-2k lines.

This plugin requires Svelte v5.43.0 exactly. Should Gimloader update its svelte version in the future, there will be a short grace period before the old version is removed.

## Usage

Import the plugin and add it to the plugins array of your `gimloader.config.ts/js` file. This should be used alongside the [esbuild-svelte](https://github.com/EMH333/esbuild-svelte) plugin.

```js
import svelte from "esbuild-svelte";
import { externalSvelte } from "@gimloader/external-svelte-plugin";

export default {
    // ...
    plugins: [
        svelte({
            compilerOptions: {
                css: "injected"
            }
        }),
        externalSvelte()
    ]
}
```
