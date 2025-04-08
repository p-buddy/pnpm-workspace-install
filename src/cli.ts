#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import { findAllWorkspacePackages, findMatchingPackage, findRoot, getPackageName } from '.';
import { execSync } from "node:child_process";
import { join } from 'node:path';

const program = new Command()
  .version(version)
  .option('-d, --debug')
  .argument('[package]', 'Package name to install')
  .option('-p, --pkg <pkg>', 'Package name to install (can also be provided as the first-and-only positional argument)')
  .option('-f, --filter <filter>', 'Filter target for installation')
  .option('-x, --prefix <prefix>', 'Prefix for the package name')
  .option('-D, --save-dev', 'Install as devDependency')
  .parse();

let { pkg, filter, prefix, debug, saveDev } = program.opts();

pkg ??= program.args[0];

if (!pkg)
  throw new Error("Package name is required (either as the first-and-only positional argument or as the --pkg / -p option)");

try {
  const root = findRoot();
  console.log(`(Using '${root}' as root)`);

  const packages = findAllWorkspacePackages(root);

  filter ??= getPackageName(join(process.cwd(), "package.json"));

  if (!packages.has(filter)) throw new Error(`Attempting to set filter to '${filter}' but it is not a workspace package`);

  const resolvedPkg = findMatchingPackage(packages, pkg, root, prefix);
  const resolvedFilter = findMatchingPackage(packages, filter, root, prefix);

  console.log(`Installing '${resolvedPkg}' into '${resolvedFilter}'...`);

  const devFlag = saveDev ? ' -D' : '';
  const command = `pnpm add${devFlag} "workspace:${resolvedPkg}@*" --filter ${resolvedFilter}`;

  if (debug) console.log(`Would run: ${command}`);
  else execSync(command, { stdio: "inherit" });

} catch (error) {
  console.error("Installation failed:", error);
  process.exit(1);
}