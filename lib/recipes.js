import * as fs from 'fs';
import * as path from 'path';
import logger from "./logger.js";
import utils from './utils.js';
import _ from "underscore";
import { fileURLToPath } from 'url';

export default {
  has, get, list, save, remove, rename, reset
};

var path_home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
var path_user = path.join(path_home, '.tn.json');
var path_project = path.join(process.cwd(), 'tn.json');
var tnJson = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tn.json')
var recipes_system, recipes_user, recipes_project;

try {
  recipes_system = JSON.parse(fs.readFileSync(tnJson, 'utf-8'));
} catch (err) {
  recipes_system = {};
}

try {
  recipes_user = JSON.parse(fs.readFileSync(path_user, 'utf-8'));
} catch (err) {
  recipes_user = {};
}

try {
  recipes_project = JSON.parse(fs.readFileSync(path_project, 'utf-8'));
} catch (err) {
  recipes_project = {};
}

var recipes_combined = _.extend({}, recipes_system, recipes_user, recipes_project);

function has(name) {
  return _.has(recipes_combined, name);
}

function get(name, ingredient) {
  var recipe;

  if (typeof recipes_combined[name] === 'string') {
    recipe = recipes_combined[name].split(' ');
  } else {
    recipe = recipes_combined[name];
  }

  if (ingredient) {

    recipe = _.map(recipe, function(val) {

      // TODO: Account for spaces in ingredient ("ddd ddd")
      return val.replace('%s', ingredient);
    });
  }

  return recipe;
}

function list(forReadMe) {

  if (forReadMe) {

    _.each(recipes_system, function(recipe, name) {
      console.log('|' + name + '|' + utils.join(recipe) + '|');
    });

    return;
  }

  console.log('Recipes defined by: ' + ('built-in'.green) + ', ' + ('user'.cyan) + ', ' + ('user-override'.blue) + ', ' + ('project'.yellow) + ' and ' + ('project-override'.red));
  console.log();

  var recipes = _.keys(recipes_combined).sort();

  _.each(recipes, function(recipe) {
    var args = recipes_combined[recipe],
      color;

    if (_.has(recipes_project, recipe)) {
      color = _.has(recipes_system, recipe) || _.has(recipes_user, recipe) ? 'red' : 'yellow';
    } else if (_.has(recipes_user, recipe)) {
      color = _.has(recipes_system, recipe) ? 'blue' : 'cyan';
    } else {
      color = 'green';
    }

    var commands = '';

    if (_.isString(args)) {
      commands += ' ' + args;
    } else {
      commands += utils.join(args);
    }

    console.log('  ' + recipe + ': ' + commands[color]);

  });

  console.log();
}

function save(recipe, args, location) {

  if (!validateRecipeName(recipe)) {
    return;
  }

  location = location || 'user';

  if (location == 'project' && _.has(recipes_project, recipe)) {
    logger.info('Changed existing project recipe');
  } else if (location == 'user' && _.has(recipes_user, recipe)) {
    logger.info('Changed existing user recipe');
  } else if (location == 'project' && _.has(recipes_user, recipe)) {
    logger.info('Saved project recipe, overriding user');
  } else if (location === 'project' && _.has(recipes_system, recipe)) {
    logger.info('Saved project recipe, overriding built-in');
  } else if (location === 'user' && _.has(recipes_system, recipe)) {
    logger.info('Saved user recipe, overriding built-in');
  } else {
    logger.info('Saved ' + location + ' recipe');
  }

  if (location == 'project') {
    recipes_combined[recipe] = recipes_project[recipe] = args;
    fs.writeFileSync(path_project, JSON.stringify(recipes_project));
  } else {
    recipes_combined[recipe] = recipes_user[recipe] = args;
    fs.writeFileSync(path_user, JSON.stringify(recipes_user));
  }

  var clr;

  if (_.has(recipes_project, recipe)) {
    clr = _.has(recipes_system, recipe) || _.has(recipes_user, recipe) ? 'red' : 'yellow';
  } else if (_.has(recipes_user, recipe)) {
    clr = _.has(recipes_system, recipe) ? 'blue' : 'cyan';
  } else {
    clr = 'green';
  }

  console.log();
  console.log('  ' + recipe + ': ' + utils.join(args)[clr]);

  console.log();
}

function remove(recipe, location) {

  if (!validateRecipeName(recipe)) {
    return;
  }

  location = location || 'user';

  if (_.has(recipes_user, recipe) === false && _.has(recipes_project, recipe) === false) {
    logger.error('Unknown user or project recipe: ' + (recipe || '(none)').cyan);
    return;
  }

  if (location == 'project') {
    delete recipes_project[recipe];
    fs.writeFileSync(path_project, JSON.stringify(recipes_project));
  } else {
    delete recipes_user[recipe];
    fs.writeFileSync(path_user, JSON.stringify(recipes_user));
  }

  recipes_combined = _.extend({}, recipes_system, recipes_user, recipes_project);

  logger.info('Removed ' + location + ' recipe: ' + recipe.cyan);

  console.log();
}

function rename(oldRecipe, newRecipe, location) {

  if (!validateRecipeName(newRecipe)) {
    return;
  }

  if (_.has(recipes_user, oldRecipe) === false && _.has(recipes_project, oldRecipe) === false) {
    logger.error('Unknown user or project recipe: ' + oldRecipe.yellow);
    return;
  }

  if (location == 'project') {
    recipes_project[newRecipe] = recipes_project[oldRecipe];
    delete recipes_project[oldRecipe];
    fs.writeFileSync(path_project, JSON.stringify(recipes_project));
  } else {
    recipes_user[newRecipe] = recipes_user[oldRecipe];
    delete recipes_user[oldRecipe];
    fs.writeFileSync(path_user, JSON.stringify(recipes_user));
  }

  logger.info('Renamed recipe: ' + oldRecipe.yellow + ' > ' + newRecipe.yellow);
  recipes_combined = _.extend({}, recipes_system, recipes_user);

  console.log();
}

function reset(location) {

  if (location == 'project') {
    fs.unlinkSync(path_project);
    logger.info('Reset project recipes');
  } else {
    fs.unlinkSync(path_user);
    logger.info('Reset user recipes');
  }

  console.log();
}

function validateRecipeName(name) {

  if (!name.match(/^[a-z0-9]+(-[a-z0-9]+)*$/i)) {
    logger.error('Invalid recipe name: ' + (name || '(none)').yellow);
    return false;
  }

  return true;
}
