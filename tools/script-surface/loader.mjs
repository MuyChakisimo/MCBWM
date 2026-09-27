export async function resolve(spec, ctx, next) {
  if (spec === "@minecraft/server" || spec === "@minecraft/server-ui")
    return { url: new URL("./stub-server.mjs", import.meta.url).href, shortCircuit: true };
  return next(spec, ctx);
}
