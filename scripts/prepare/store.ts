/**
 * Store new assets into IPFS.
 * Look for avatar metadata under `./assets/metadata`, then the refered images under `./assets/images`
 * First store image on IPFS, update avatars metadata with IPFS hashes
 * Then store directory `./assets/metadata` on IPFS and update `data/${network}/state.json` with base_uri.
 */

import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { create, globSource } from "ipfs-http-client";

import {
  ContractStatePath,
  ContractState,
  BaseUriStatePath,
  metadataDirPath,
  imageDirPath,
  env,
  readJSON,
  writeJSON,
} from "../utils";

const { infuraIPFSId, infuraIPFSSecret } = env;

const auth =
  "Basic " +
  Buffer.from(infuraIPFSId + ":" + infuraIPFSSecret).toString("base64");

const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

const main = async () => {
  const network = hardhat.network.name;

  if (!infuraIPFSId || !infuraIPFSSecret) {
    throw Error("Infura id and secret not provided in `.env.json`");
  }

  /**
   * Step 1: collect metadata for images need to be stored
   */
  const avatars = [] as { [key: string]: any }[];
  await Promise.all(
    fs
      .readdirSync(metadataDirPath, { withFileTypes: true })
      .map(async (dirent) => {
        // exclude files
        if (dirent.isDirectory()) {
          return;
        }

        // exclude file name with not only numbers
        if (!/^\d+$/.test(dirent.name)) {
          return;
        }

        const metadataPath = path.join(metadataDirPath, dirent.name);
        const metadata = readJSON(metadataPath);

        // exclude metadata that already stored IPFS
        if (metadata.image.startsWith("ipfs://")) {
          return;
        }

        const imagePath = path.join(imageDirPath, metadata.image);
        // check if image exists
        if (!fs.existsSync(imagePath)) {
          throw Error(
            `[${network}:store] Image ${imagePath} for avatar ${metadataPath} does not exist.`
          );
        }

        avatars.push({ metadata, imagePath, metadataPath });
      })
  );

  /**
   * Step 2: store images on IPFS and update metadata
   */
  console.log(`Storing ${avatars.length} avatar images...`);
  await Promise.all(
    avatars.map(async ({ metadata, imagePath, metadataPath }) => {
      const imgdata = fs.readFileSync(imagePath);
      const { cid } = await ipfs.add(imgdata, { pin: true });

      // wait 3000 ms to avoid rate limit
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // store metadata file with updated image uri
      writeJSON(
        { ...metadata, image: `ipfs://${cid.toString()}` },
        metadataPath
      );
    })
  );
  console.log(`    done.`);

  /**
   * Step 3: store metadata directory and update baser uri
   */

  // for local host and rinkeby, read placeholder base uri from contract state
  // for mainnet, read production ready base uri from base uri state
  let base_uri;
  if (network === "mainnet") {
    base_uri = readJSON(BaseUriStatePath(network)).base_uri;
  } else {
    base_uri = ContractState(network).base_uri;
  }

  // check if already exists
  if (base_uri) {
    console.log(`[${network}:store] Base URI recorded, skipping...`);
  } else {
    console.log(`[${network}:store] Storing metadata for base URI ...`);

    let base_uri;
    for await (const file of ipfs.addAll(globSource(metadataDirPath, "**/*"), {
      pin: true,
      wrapWithDirectory: true,
    })) {
      // filter out root hash
      if (file.path === "") {
        base_uri = `ipfs://${file.cid.toString()}/`;
      }
    }

    if (!base_uri) {
      throw Error(
        `[${network}:store] Error in storing metadata, cannot locate root hash.`
      );
    }

    // for local host and rinkeby, write placeholder base uri to contract state
    // for mainnet, write production ready base uri to base uri state, which will be read by "setBaseURI" script
    if (network === "mainnet") {
      // write to contract state
      writeJSON({ base_uri }, BaseUriStatePath(network));
    } else {
      const contractState = ContractState(network);
      // write to contract state
      contractState.base_uri = base_uri;
      writeJSON(contractState, ContractStatePath(network));
    }

    console.log(`    base URI: ${base_uri}`);
  }

  console.log(`    done.`);
};

main();
