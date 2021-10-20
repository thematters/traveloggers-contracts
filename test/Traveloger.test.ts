import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { createAddresses, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

const deployTraveloger = async () => {
  const Traveloger = await ethers.getContractFactory("Traveloger");
  const traveloger = await Traveloger.deploy(
    "Traveloger_Tester",
    "LOGR",
    20,
    "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
  );
  return await traveloger.deployed();
};

describe("Traveloger", () => {
  describe("Lottery", () => {
    it("Can draw lottery from a list of accounts", async () => {
      // account test list, repeating with the same account
      const candidateAmount = 500;
      const winnerAmount = 10;

      const addressList = createAddresses(candidateAmount);

      const traveloger = await deployTraveloger();

      // failed to draw lottery if amount is too large
      await expect(
        traveloger.drawLottery(addressList, addressList.length + 1)
      ).to.be.revertedWith(
        "amount_ must be less than or equal to addresses_.length"
      );

      const tx = await traveloger.drawLottery(addressList, winnerAmount);

      // get emitted event
      const logs = await traveloger.queryFilter(
        traveloger.filters.LotteryWinners()
      );
      // @ts-ignore
      const { winners } = logs[0].args;

      expect(await traveloger.ownerOf(1)).to.equal(winners[0]);
      expect(await traveloger.ownerOf(winnerAmount)).to.equal(
        winners[winners.length - 1]
      );

      // assuming base fee + tip ~ 100 gwei
      const { gasUsed } = await tx.wait();
      console.log(
        `        Gas used for drawing ${winnerAmount} winners from ${candidateAmount} addresses: ${gasUsed}. Estimated ETH: ${toGasCost(
          gasUsed
        )}`
      );
    });

    it("Can random draw from a list of accounts without duplicates", async () => {
      const amount = 10;
      const addressList = createAddresses(10);

      const traveloger = await deployTraveloger();
      const result = await traveloger._randomDraw(addressList, amount);

      // should be no duplication in result
      expect(new Set(result).size).to.equal(result.length);
    });
  });
});
