import { task, types } from "hardhat/config";

import { getTraveloggersContract } from "../utils";

task("logbook:read", "read Logbook for a given avatar")
  .addParam("tokenId", "to the given traveloggers id")
  .setAction(async ({ tokenId }, hardhat) => {
    const network = hardhat.network.name;

    // get contract
    const traveloggers = await getTraveloggersContract({ network, hardhat });

    console.log(new Date(), `Running task:`, { tokenId });

    const contractUri = await traveloggers.contractURI();
    console.log(new Date(), `contractUri`, contractUri);

    // run task
    try {
      const totalSupply = await traveloggers.totalSupply();
      console.log(new Date(), `totalSupply:`, totalSupply);

      const owner = await traveloggers.owner();
      console.log(new Date(), `owner:`, owner);

      const tokenUri = await traveloggers.tokenURI(tokenId);
      console.log(new Date(), "readLogbook tokenUri:", tokenUri);

      const tokenOwner = await traveloggers.ownerOf(tokenId);
      console.log(new Date(), "readLogbook tokenOwner:", tokenOwner);

      const res = await traveloggers.readLogbook(tokenId);
      console.log(new Date(), "readLogbook res:", res);
    } catch (err) {
      console.error(new Date(), "ERROR:", err);
    }
  });

task("logbook:append", "append Logbook to a given avatar")
  .addParam("address", "for the given address")
  .addParam("tokenId", "for the given tokenId")
  .addParam("message", "the log message")
  .setAction(async ({ address, tokenId, message }, hardhat) => {
    const network = hardhat.network.name;

    // get contract
    const traveloggers = await getTraveloggersContract({ network, hardhat });

    console.log(new Date(), `Running task appendLog:`, { address, tokenId, message });

    // run task
    try {
      const balance = await traveloggers.balanceOf(address);
      console.log(new Date(), `get tx for owner: "${address}"`, balance);

      const tx1 = await traveloggers.approve(address, tokenId);
      console.log(new Date(), "tx1:", tx1);

      const tx = await traveloggers.appendLog(tokenId, message);
      console.log(new Date(), "tx:", tx);
    } catch (err) {
      console.error(new Date(), "ERROR:", err);
    }
  });
