#!/usr/bin/env node

'use strict';

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as compat from 'appc-compat';
import updateNotifier from 'update-notifier';

import recipes from '../lib/recipes.js';
import setup from '../lib/setup.js';
import utils from '../lib/utils.js';
import kitchen from '../lib/kitchen.js';

var pkg = {};
var pkgFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
try {
  pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf-8'));
} catch (err) {
  throw err;
}

var args = process.argv.slice(2);

// help
var cmd = args.shift();

if (cmd === '-h' || cmd === '--help' || cmd === 'help') {
  displayHelp();
}

// version
else if (cmd === '-v' || cmd === '--version' || cmd === 'version') {
  console.log(pkg.version);

} else {

  var target;

  // project
  if (cmd === 'project') {
    cmd = args.shift();
    target = 'project';
  }

  // list
  if (cmd === 'list' || cmd === 'recipes') {
    displayBanner();

    recipes.list(args[0] === 'readme');
  }

  // default
  else if (cmd === 'default') {
    displayBanner();

    recipes.setDefault(args);
  }

  // set
  else if (cmd === 'save') {
    displayBanner();

    recipes.save(args.shift(), args, target);
  }

  // rename
  else if (cmd === 'rename') {
    displayBanner();

    recipes.rename(args[0], args[1], target);
  }

  // remove
  else if (cmd === 'remove') {
    displayBanner();

    recipes.remove(args[0], target);
  }

  // uninstall
  else if (cmd === 'uninstall') {
    displayBanner(false);

    setup.uninstall();
  }

  // reset
  else if (cmd === 'reset') {
    displayBanner();

    recipes.reset(target);
  }

  // generate
  else if (cmd === 'generate') {
    displayBanner();

    setup.generate();
  }

  // no args
  else if (!cmd) {
    displayHelp();
  }

  // unknown
  else {

    // deprecated
    if (cmd !== 'run' && cmd !== 'build' && cmd !== 'r' && cmd !== 'b') {
      args.unshift(cmd);

    } else {
      console.warn('DEPRECATED: '.red.bold + ' Use ' + 'tn'.yellow + ' instead of ' + ('tn ' + cmd).yellow + '\n');
    }

    var tray = kitchen.cook(args);

    args = tray ? tray.dinner : args;

    var opts = {
      stdio: 'inherit'
    };

    if (process.argv.indexOf('--prefer-appc') !== -1) {
        opts.preferAppc = true;
    }
    else if (process.argv.indexOf('--prefer-ti') !== -1) {
        opts.preferAppc = false;
    }
    else {
      // try to detect if project is platform
      try {

        var tiapp = fs.readFileSync(path.join(process.cwd(), 'tiapp.xml'), {
          encoding: 'utf-8'
        });

        // platform
        if (tiapp.indexOf('appc-app-id') !== -1) {
          opts.preferAppc = true;
        }

      } catch (e) {}
    }

    // Show what TiNy made (only for build and create, not to mess with JSON output)
    console.log('TiNy'.cyan.bold + ' cooked: ' + ('[appc] ti ' + utils.join(args)).yellow + '\n');

    var eat = function () {
      compat.ti(args, opts);
    };

    // verbose prompt
    if (tray && tray.recipe) {
      kitchen.confirm(tray, eat);
    } else {
      eat();
    }
  }
}

// help
function displayHelp() {

  displayBanner();

  console.log('Commands:');
  console.log();
  console.log('  *'.cyan + '\t\t\t\t' + 'cook recipes for ' + '[appc] ti build'.yellow + '.');
  console.log();
  console.log('  list, recipes'.cyan + '\t\t\t' + 'lists all recipes in the book.');
  console.log();
  console.log('  Add ' + 'project'.yellow + ' before the next commands to use ' + 'tn.json'.yellow + ' in current dir.');
  console.log();
  console.log('  [project] save <name> *'.cyan + '\t' + 'save a recipe, possibly overriding a built-in.');
  console.log('  [project] rename <old> <new>'.cyan + '\t' + 'renames a recipe.');
  console.log('  [project] remove <name>'.cyan + '\t' + 'removes a recipe, possibly restoring an overridden built-in');
  console.log('  [project] reset'.cyan + '\t\t' + 'removes all custom recipes, restoring the built-in');
  console.log();
  console.log('  generate'.cyan + '\t\t\t' + 'generates simulators/device user-recipes (' + 'tn iphone6plus'.yellow + ')');
  console.log();
  console.log('  uninstall'.cyan + '\t\t\t' + 'uninstalls the old 2.x Titanium CLI hook');
  console.log();
  console.log('  -h, --help, help'.cyan + '\t\t' + 'displays help');
  console.log('  -v, --version, version'.cyan + '\t' + 'displays the current version');
  console.log('  --verbose'.cyan + '\t\t\t' + 'shows what\'s cooking and confirm or save the recipe');
  console.log('  --prefer-appc'.cyan + '\t\t\t' + 'forces TiNy to run the recipe with $ appc [...]');
  console.log('  --prefer-ti'.cyan + '\t\t\t' + 'forces TiNy to run the recipe with $ ti [...]');
  console.log();
}

function displayBanner(doUpdate) {

  if (doUpdate !== false) {
    updateNotifier({pkg: pkg}).notify();
  }

  // display banner
  console.log('TiNy'.cyan.bold + ', version ' + pkg.version);
  console.log('Copyright (c) 2016-2021, Jason Kneen. All Rights Reserved.');
  console.log();
}
