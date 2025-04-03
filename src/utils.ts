import { findUpSync } from 'find-up';
import { readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { parse } from "yaml";
import { sync } from "glob";

export const findRoot = () => {
  const workspaceFile = findUpSync('pnpm-workspace.yaml');
  if (!workspaceFile) throw new Error('Could not find pnpm-workspace.yaml in any parent directory');
  return dirname(workspaceFile);
}

const getPackageName = (path: string): string => JSON.parse(readFileSync(path, "utf8")).name;

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
  if (pkgPrefix === undefined)
    try {
      const result = findMatchingPackage(packages, pkgName, root, "");
      if (result) return result;
    }
    catch { }

  pkgPrefix = getPackageName(join(root ?? findRoot(), "package.json"));

  if (!pkgName.startsWith(pkgPrefix)) pkgName = pkgPrefix + pkgName;
  if (packages.has(pkgName)) return pkgName;

  const matches = Array.from(packages).filter(pkg => pkg.startsWith(pkgName));

  if (matches.length === 1) return matches[0];
  if (matches.length > 1) throw new Error(`Ambiguous package name: ${pkgName}`);
  throw new Error(`Package not found: ${pkgName}`);
}