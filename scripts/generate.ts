import Articles from "articles";
import fs from "fs";
import path from "path";

import { races, ideologies, characters, totalSupply } from "./settings.json";
import { metadataDirPath } from "./util";

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

// main function
const main = async () => {
  console.log(`Generating ${totalSupply} avatars to ${metadataDirPath}...`);

  // exhaust all combination as candidates
  // both ideology and character can repeat twice
  const candidates = [] as { [key: string]: string }[];
  races.map((race) =>
    [...ideologies, ...ideologies].map((ideology) =>
      [...characters, ...characters].map((character) =>
        candidates.push({ race, ideology, character })
      )
    )
  );

  if (totalSupply > candidates.length) {
    throw Error(
      `Not enough attributes to generate ${totalSupply} creatures, total combination: ${candidates.length}.`
    );
  }

  for (let id = 1; id <= totalSupply; id++) {
    // random sample one combination
    const { race, character, ideology } = sample(candidates, false);

    const name = `Matties #${id}`;

    // assemble metadata
    const creature = {
      name,
      description: `${capitalize(
        Articles.articlize(character)
      )}, ${ideology} ${race}.`,
      image: `${id}.png`,
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
      path.join(metadataDirPath, `${id}`),
      JSON.stringify(creature, null, 2)
    );
  }

  console.log("    done.");
};

main();
