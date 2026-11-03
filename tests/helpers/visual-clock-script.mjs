/** The same Date-only clock runs in Node and as a browser init script. */
export function installFixedDate(epoch) {
  if (!Number.isSafeInteger(epoch) || epoch <= 0)
    throw Error("VISUAL_EPOCH_REQUIRED");
  const NativeDate = Date;
  globalThis.Date = new Proxy(NativeDate, {
    construct(target, args, newTarget) {
      return Reflect.construct(target, args.length ? args : [epoch], newTarget);
    },
    apply() {
      return new NativeDate(epoch).toString();
    },
    get(target, key, receiver) {
      return key === "now" ? () => epoch : Reflect.get(target, key, receiver);
    },
  });
}
