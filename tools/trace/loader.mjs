export async function resolve(spec, ctx, next) {
  if (spec.startsWith("@minecraft/")) return { url: new URL("./stub.mjs", import.meta.url).href, shortCircuit: true };
  if (spec.startsWith(".") && !spec.endsWith(".js") && !spec.endsWith(".mjs")) return next(spec + ".js", ctx);
  return next(spec, ctx);
}
