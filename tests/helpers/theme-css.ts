import { readFileSync } from "node:fs";

export function readThemeBlocks(input = readFileSync("src/styles/themes.css", "utf8")) {
  const source = input.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = new Map<string, Map<string, string>>();
  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const theme of rule[1].matchAll(/\[data-theme="([a-z-]+)"\]/g)) {
      const values = new Map<string, string>();
      for (const declaration of rule[2].matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
        if (values.has(declaration[1])) throw Error(`Yinelenen token: ${declaration[1]}`);
        values.set(declaration[1], declaration[2].trim());
      }
      if (blocks.has(theme[1])) throw Error(`Yinelenen tema: ${theme[1]}`);
      blocks.set(theme[1], values);
    }
  }
  return blocks;
}

export function resolveHex(tokens: Map<string, string>, name: string, visited = new Set<string>()): string {
  if (visited.has(name)) throw Error(`Döngüsel renk: ${name}`);
  visited.add(name);
  const value = tokens.get(name);
  if (!value) throw Error(`Eksik renk: ${name}`);
  const alias = /^var\((--[a-z0-9-]+)\)$/.exec(value);
  if (alias) return resolveHex(tokens, alias[1], visited);
  if (!/^#[a-f0-9]{6}$/i.test(value)) throw Error(`Opak hex renk gerekli: ${name}`);
  return value;
}

export function contrast(first: string, second: string): number {
  const luminance = (hex: string) => {
    const channels = [1, 3, 5].map(offset => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
