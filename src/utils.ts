import { findUpSync } from 'find-up';
import { readFileSync, } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parse } from "yaml";
import { sync } from "glob";

export const findRoot = () => {
  const workspaceFile = findUpSync('pnpm-workspace.yaml');
  if (!workspaceFile) throw new Error('Could not find pnpm-workspace.yaml in any parent directory');
  return dirname(workspaceFile);
}

export const getPackageName = (path: string): string => JSON.parse(readFileSync(path, "utf8")).name;

const getWorkspacePatterns = (root?: string): string[] =>
  parse(readFileSync(join(root ?? findRoot(), "pnpm-workspace.yaml"), "utf8")).packages ?? [];

const expandPackageJsonPaths = (patterns: string[], root?: string) => patterns
  .flatMap(pattern =>
    sync(resolve(root ?? findRoot(), `${pattern}/package.json`), { ignore: ['**/node_modules/**'] })
  );

export const findAllWorkspacePackages = (root?: string) =>
  expandPackageJsonPaths(getWorkspacePatterns(root))
    .map(getPackageName)
    .reduce((set, name) => set.add(name), new Set<string>());

export const findMatchingPackage = (
  packages: Set<string>, pkgName: string, root?: string, pkgPrefix?: string,
) => {
  if (packages.has(pkgName)) return pkgName;
  const arr = Array.from(packages);

  const nonPrefixed = arr.filter(pkg => pkg.startsWith(pkgName));
  if (nonPrefixed.length === 1) return nonPrefixed[0];

  pkgPrefix ??= getPackageName(join(root ?? findRoot(), "package.json"));

  const prefixed = arr.filter(pkg => pkg.startsWith(pkgPrefix + pkgName));
  if (prefixed.length === 1) return prefixed[0];

  const prefixedWithDash = arr.filter(pkg => pkg.startsWith(pkgPrefix + "-" + pkgName));
  if (prefixedWithDash.length === 1) return prefixedWithDash[0];

  if (nonPrefixed.length === 0 && prefixed.length === 0 && prefixedWithDash.length === 0)
    throw new Error(`Package not found: '${pkgName}' (including prefix: '${pkgPrefix + pkgName}' and prefixed with dash: '${pkgPrefix + "-" + pkgName}')`);
  throw new Error(`Ambiguous package name: ${pkgName}\nCandidates:\n-${[...nonPrefixed, ...prefixed, ...prefixedWithDash].join("\n-")}`);
}