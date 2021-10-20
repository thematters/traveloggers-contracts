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

import { infuraIPFSId, infuraIPFSSecret } from "../.env.json";
import { contractStatePath, metadataDirPath, imageDirPath } from "./util";

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
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));

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

      // store metadata file with updated image uri
      fs.writeFileSync(
        metadataPath,
        JSON.stringify(
          { ...metadata, image: `ipfs://${cid.toString()}` },
          null,
          2
        )
      );
    })
  );
  console.log(`    done.`);

  /**
   * Step 3: store metadata directory and update baser uri
   */
  let contractState;
  try {
    contractState = require(contractStatePath(network));
  } catch (err) {
    contractState = {};
  }

  // check if already exists
  if (contractState.base_uri) {
    console.log("[${network}:store] Base URI recorded, skipping...");
  } else {
    console.log("[${network}:store] Storing metadata for base URI ...");

    let base_uri;
    for await (const file of ipfs.addAll(globSource(metadataDirPath, "**/*"), {
      pin: true,
      wrapWithDirectory: true,
    })) {
      // filter out root hash
      if (file.path === "") {
        base_uri = `ipfs://${file.cid.toString()}`;
      }
    }

    if (!base_uri) {
      throw Error(
        "[${network}:store] Error in storing metadata, cannot locate root hash."
      );
    }

    // write to contract state
    contractState.base_uri = base_uri;
    fs.writeFileSync(
      contractStatePath(network),
      JSON.stringify(contractState, null, 2)
    );
    console.log(`    base URI: ${base_uri}`);
  }

  console.log(`    done.`);
};

main();
