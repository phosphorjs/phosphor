/*-----------------------------------------------------------------------------
| Copyright (c) 2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  UUID
} from '@phosphor/coreutils';

// A unique id for this collaborator.
export const COLLABORATOR_ID = UUID.uuid4();

// Colors to choose from when rendering collaborator cursors.
const COLORS = [
  '#e41a1c',
  '#377eb8',
  '#4daf4a',
  '#984ea3',
  '#ff7f00',
  '#a65628',
  '#f781bf',
  '#999999'
];

// Names to choose from when rendering collaborator cursors, chosen from
// Ubuntu release codenames.
const NAMES = [
  'Warty Warthog',
  'Hoary Hedgehog',
  'Breezy Badger',
  'Dapper Drake',
  'Edgy Eft',
  'Feisty Fawn',
  'Gutsy Gibbon',
  'Hardy Heron',
  'Intrepid Ibex',
  'Jaunty Jackalope',
  'Karmic Koala',
  'Lucid Lynx',
  'Maverick Meerkat',
  'Natty Narwhal',
  'Oneiric Ocelot',
  'Precise Pangolin',
  'Quantal Quetzal',
  'Raring Ringtail',
  'Saucy Salamander',
  'Trusty Tahr',
  'Utopic Unicorn',
  'Vivid Vervet',
  'Wily Werewolf',
  'Xenial Xerus',
  'Yakkety Yak',
  'Zesty Zapus',
  'Artful Aardvark',
  'Bionic Beaver',
  'Cosmic Cuttlefish',
  'Disco Dingo',
  'Eoan Ermine'
];

// A random color for the current collaborator.
export const COLLABORATOR_COLOR =  COLORS[
  Math.floor(Math.random() * COLORS.length)
];

// A random name for the current collaborator.
export const COLLABORATOR_NAME =  NAMES[
  Math.floor(Math.random() * NAMES.length)
];
