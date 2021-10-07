/**
 * start of settings
 */

// races are nouns
const races = ["one-eye toad", "two-antenna elephant", "three-leg horse"];

// ideologies are adjectives
const ideologies = [
  "left wing",
  "right wing",
  "anarchist",
  "pacifist",
  "nihilists",
  "royalist",
];

// characters are adjectives
const characters = [
  "imaginative",
  "wanderlusty",
  "sentimental",
  "practical",
  "faithful",
];

// background colors in hex code
const background_colors = ["f8edcd", "c2aa3e", "f8edcd", "008080"];

// names
const names = [
  "Zoe",
  "Jetee",
  "Tartar",
  "Horogu",
  "Konggo",
  "Teleluya",
  "Zzuween",
  "Kuuhuru",
  "Teteerha",
  "Dongmaguru",
  "Honga",
  "Tamara",
  "Erwa",
  "Junkun",
];

/**
 * end of settings
 */

import Articles from "articles";
import fs from "fs";
import path from "path";

const totalSupply = names.length;

/**
 * Draw random element and remove it from array.
 * @param {bool} replacement: sample with replacement or not, default to true
 * @returns element been drawn
 */
const sample = (array: any[], replacement = true) => {
  // random index
  const index = Math.floor(Math.random() * array.length);
  const el = array[index];

  // remove element
  if (!replacement) {
    array.splice(index, 1);
  }

  return el;
};

/**
 * Capitalize first letter of a string
 * @returns the capitalized string
 */
const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// path to metadata
const metatdataPath = path.join(__dirname, "..", "assets", "metadata");

// main function
const main = async () => {
  if (totalSupply > races.length * ideologies.length * characters.length) {
    throw Error(`Not enough attributes to generate ${totalSupply} creatures.`);
  }

  // exhaust all combination as candidates
  const candidates = [] as { [key: string]: string }[];
  races.map((race) =>
    ideologies.map((ideology) =>
      characters.map((character) =>
        candidates.push({ race, ideology, character })
      )
    )
  );

  for (let id = 1; id <= totalSupply; id++) {
    // random sample one combination
    const { race, character, ideology } = sample(candidates, false);

    // assemble metadata
    const creature = {
      name: sample(names, false),
      description: `${capitalize(
        Articles.articlize(character)
      )} ${ideology} ${race} called ${names[id - 1]}.`,
      background_color: sample(background_colors),
      image: `${id}.jpeg`,
      attributes: [
        {
          trait_type: "Race",
          value: race,
        },
        {
          trait_type: "Ideology",
          value: ideology,
        },
        {
          trait_type: "Character",
          value: character,
        },
      ],
    };

    // write to file
    fs.writeFileSync(
      path.join(metatdataPath, `${id}`),
      JSON.stringify(creature, null, 2)
    );
  }
};

main();
