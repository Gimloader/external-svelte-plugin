import type { Plugin } from "esbuild";

const keysCache = new Map<string, string[]>();
const validImports = [
    "svelte",
    "svelte/internal/client",
    "svelte/animate",
    "svelte/attachments",
    "svelte/easing",
    "svelte/events",
    "svelte/motion",
    "svelte/reactivity/window",
    "svelte/reactivity",
    "svelte/store",
    "svelte/transition",
]

const reserved = ["if", "await"];
const svelteVersion = "5_43_0";

export function externalSvelte(): Plugin {
    return {
        name: "external-svelte",
        setup(build) {
            build.onResolve({ filter: /^svelte/ }, async (args) => {
                if(validImports.includes(args.path)) {
                    return { path: args.path, namespace: "external-svelte" };
                }

                return { path: args.path, namespace: "external-svelte-ignore" }
            }); 

            build.onLoad({ filter: /.*/, namespace: "external-svelte" }, async (args) => {
                const contents = await createContents(args.path, "Index");
                return { contents, loader: "js" }
            });

            build.onLoad({ filter: /.*/, namespace: "external-svelte-ignore" }, () => {
                return { contents: "", loader: "js" }
            });
        }
    }
}

async function createContents(path: string, type: string){ 
    let keys = keysCache.get(path);
    if(!keys) {
        keys = Object.keys(await import(path));
        keysCache.set(path, keys);
    }

    const normalKeys = keys.filter(k => !reserved.includes(k));
    const reservedKeys = keys.filter(k => reserved.includes(k));

    // Add normal exports
    let contents = normalKeys.map(k => `const ${k} = /** @__PURE__ */ (() => GL.svelte_${svelteVersion}.${type}.${k})();`).join("\n")
        + `export { ${normalKeys.join(", ")} };\n`;
    
    // Add exports with a reserved keyword, if applicable
    if(reservedKeys.length === 0) return contents;
    contents += reservedKeys.map(k => `const ${k}_export = /** @__PURE__ */ (() => GL.svelte_${svelteVersion}.${type}.${k})();`).join("\n")
        + `export { ${reservedKeys.map(k => `${k}_export as ${k}`)} };\n`;

    return contents;
}