export function sozlukHref(subpath: string, isSubdomain: boolean): string {
  const normalized = subpath.startsWith("/") ? subpath : `/${subpath}`;
  if (isSubdomain) {
    return normalized;
  }
  return normalized === "/" ? "/sozluk" : `/sozluk${normalized}`;
}
