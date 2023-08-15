export function must(
  condition?: unknown,
  message?: string,
  args?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    const msg = `${message ?? "assertion failed"}`;
    if (args) {
      console.error(msg, { args: JSON.stringify(args) });
    } else {
      console.error(msg);
    }
    throw Error(msg);
  }
}
