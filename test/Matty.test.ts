import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { createAddresses, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

const deployMatty = async () => {
  const Matty = await ethers.getContractFactory("Matty");
  const matty = await Matty.deploy(
    "Matty_Tester",
    "MATT",
    20,
    "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
  );
  return await matty.deployed();
};

describe("Matty", () => {
  describe("Lottery", () => {
    it("Can draw lottery from a list of accounts", async () => {
      // account test list, repeating with the same account
      const candidateAmount = 500;
      const winnerAmount = 10;

      const addressList = createAddresses(candidateAmount);

      const matty = await deployMatty();

      // failed to draw lottery if amount is too large
      await expect(
        matty.drawLottery(addressList, addressList.length + 1)
      ).to.be.revertedWith(
        "amount_ must be less than or equal to addresses_.length"
      );

      const tx = await matty.drawLottery(addressList, winnerAmount);

      // get emitted event
      const logs = await matty.queryFilter(matty.filters.LotteryWinners());
      // @ts-ignore
      const { winners } = logs[0].args;

      expect(await matty.ownerOf(1)).to.equal(winners[0]);
      expect(await matty.ownerOf(winnerAmount)).to.equal(
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

      const matty = await deployMatty();
      const result = await matty._randomDraw(addressList, amount);

      // should be no duplication in result
      expect(new Set(result).size).to.equal(result.length);
    });
  });
});
