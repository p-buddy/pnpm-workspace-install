#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { version } from '../package.json';
import { findAllWorkspacePackages, findMatchingPackage, findRoot } from './';
import { execSync } from "node:child_process";

const program = new Command()
  .version(version)
  .option('-d, --debug')
  .requiredOption('-p, --pkg <pkg>', 'Package name to install')
  .requiredOption('-f, --filter <filter>', 'Filter target for installation')
  .parse();

const { pkg, filter } = program.opts();

try {
  const root = findRoot();
  console.log(`(Using '${root}' as root)`);

  const packages = findAllWorkspacePackages(root);
  const resolvedPkg = findMatchingPackage(packages, pkg, root);
  const resolvedFilter = findMatchingPackage(packages, filter, root);

  console.log(`Installing ${resolvedPkg} into ${resolvedFilter}...`);

  execSync(`pnpm add -D "workspace:${resolvedPkg}@*" --filter ${resolvedFilter}`, {
    stdio: "inherit"
  });
} catch (error) {
  console.error("Installation failed:", error);
  process.exit(1);
}