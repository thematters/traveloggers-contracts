import Articles from "articles";
import fs from "fs";
import path from "path";

import { races, ideologies, characters, totalSupply } from "./settings.json";
import { metadataDirPath, sample, capitalize } from "./utils";

// main function
const main = async () => {
  console.log(`Generating ${totalSupply} avatars to ${metadataDirPath}...`);

  // exhaust all combination as candidates
  // both ideology and character can repeat twice
  const candidates = [] as { [key: string]: string }[];
  races.map((race) =>
    ideologies.map((ideology) =>
      ["a", "b"].map((ideology_accessory_type) =>
        characters.map((character) =>
          ["a", "b"].map((character_accessory_type) =>
            candidates.push({
              race,
              ideology,
              ideology_accessory_type,
              character,
              character_accessory_type,
            })
          )
        )
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
    const {
      race,
      character,
      ideology,
      ideology_accessory_type,
      character_accessory_type,
    } = sample(candidates, false);

    const name = `Travelogger #${id}`;

    // assemble metadata
    const creature = {
      name,
      description: `${capitalize(
        Articles.articlize(character)
      )}, ${ideology} ${race}.`,
      // used for visual design
      _visual: {
        race,
        character: `${character} ${character_accessory_type}`,
        ideology: `${ideology} ${ideology_accessory_type}`,
      },
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
