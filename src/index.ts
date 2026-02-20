import type { Plugin } from "esbuild";

const keysCache = new Map<string, string[]>();
const imports: Record<string, string> = {
    "svelte": "Index",
    "svelte/internal/client": "Client",
    "svelte/animate": "Animate",
    "svelte/attachments": "Attachments",
    "svelte/easing": "Easing",
    "svelte/events": "Events",
    "svelte/motion": "Motion",
    "svelte/reactivity/window": "WindowReactivity",
    "svelte/reactivity": "Reactivity",
    "svelte/store": "Store",
    "svelte/transition": "Transition"
}

const reserved = ["if", "await"];
const svelteVersion = "5_43_0";

export function externalSvelte(): Plugin {
    return {
        name: "external-svelte",
        setup(build) {
            build.onResolve({ filter: /^svelte/ }, async (args) => {
                if(imports[args.path]) {
                    return { path: args.path, namespace: "external-svelte" };
                }

                return { path: args.path, namespace: "external-svelte-ignore" }
            }); 

            build.onLoad({ filter: /.*/, namespace: "external-svelte" }, async (args) => {
                const contents = await createContents(args.path);
                return { contents, loader: "js" }
            });

            build.onLoad({ filter: /.*/, namespace: "external-svelte-ignore" }, () => {
                return { contents: "", loader: "js" }
            });
        }
    }
}

async function createContents(path: string){ 
    const type = imports[path];
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