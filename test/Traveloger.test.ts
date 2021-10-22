import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";

import { createAddresses, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

let traveloggers: Contract;
describe("Traveloggers", () => {
  beforeEach(async () => {
    const TraveloggersFactory = await ethers.getContractFactory("Traveloggers");
    const Traveloggers = await TraveloggersFactory.deploy(
      "Traveloggers_Tester",
      "TLOGR",
      20,
      "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
    );
    traveloggers = await Traveloggers.deployed();
  });

  describe("Lottery", () => {
    it("Can draw lottery from a list of accounts", async () => {
      // account test list, repeating with the same account
      const candidateAmount = 500;
      const winnerAmount = 10;

      const addressList = createAddresses(candidateAmount);

      // failed to draw lottery if amount is too large
      await expect(
        traveloggers.drawLottery(addressList, addressList.length + 1)
      ).to.be.revertedWith(
        "amount_ must be less than or equal to addresses_.length"
      );

      const tx = await traveloggers.drawLottery(addressList, winnerAmount);

      // get emitted event
      const logs = await traveloggers.queryFilter(
        traveloggers.filters.LotteryWinners()
      );
      // @ts-ignore
      const { winners } = logs[0].args;

      expect(await traveloggers.ownerOf(1)).to.equal(winners[0]);
      expect(await traveloggers.ownerOf(winnerAmount)).to.equal(
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
      const result = await traveloggers._randomDraw(addressList, amount);

      // should be no duplication in result
      expect(new Set(result).size).to.equal(result.length);
    });
  });
});
