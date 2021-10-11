import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";

import { createAddresses, toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

const deployMatty = async () => {
  const Matty = await ethers.getContractFactory("Matty");
  const matty = await Matty.deploy();
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

  describe("Logbook", () => {
    it("Can read or write by token owner", async () => {
      // initial mint
      const [owner] = await ethers.getSigners();
      const token1Id = 1;
      const matty = await deployMatty();
      await matty.batchMint([owner.address]);

      // append log
      const log =
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since.";

      const tx = await matty.appendLog(token1Id, log);

      // "LogbookNewLog" event is emitted
      await expect(tx)
        .to.emit(matty, "LogbookNewLog")
        .withArgs(token1Id, owner.address);

      // assuming base fee + tip ~ 100 gwei
      const { gasUsed } = await tx.wait();
      console.log(
        `        Gas used for appendLog with ${
          log.length
        } characters: ${gasUsed}. Estimated ETH: ${toGasCost(gasUsed)}`
      );

      // logbook is locked now
      const logbook = await matty.readLogbook(token1Id);
      expect(logbook.isLocked).to.equal(true);

      // latest log is sent by token owner
      const [latestLog] = logbook.logs.slice(-1);
      expect(latestLog.sender).to.equal(owner.address);
      expect(latestLog.message).to.equal(log);
    });

    it("Can write with valid strings", async () => {
      // initial mint
      const [owner, tempOwner] = await ethers.getSigners();
      const token1Id = 1;
      const matty = await deployMatty();
      await matty.batchMint([owner.address]);

      // defined a function that unlock logbook through token swapping
      const swapToUnlock = async () => {
        await matty.transferFrom(owner.address, tempOwner.address, token1Id);
        await matty
          .connect(tempOwner)
          .transferFrom(tempOwner.address, owner.address, token1Id);
      };

      // log chinese
      const logChinese =
        "綠正春職外也事歡發是來使要北的玩心回學：活支影現上點人。到送件票有動。手覺內心動之裝放。";
      await matty.appendLog(token1Id, logChinese);
      const logbook = await matty.readLogbook(token1Id);
      const [latestLog] = logbook.logs.slice(-1);
      expect(latestLog.message).to.equal(logChinese);

      // log exceeds max length
      const logExceeds =
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.";
      const logChineseExceeds =
        "綠正春職外也事歡發是來使要北的玩心回學：活支影現上點人。到送件票有動。手覺內心動之裝放。綠正春職外也事歡發是來使要北的玩心回學：活支影現上點人。到送件票有動。手覺內心動之裝放。";
      await swapToUnlock();
      await expect(matty.appendLog(token1Id, logExceeds)).to.be.revertedWith(
        "log exceeds max length"
      );

      await swapToUnlock();
      await expect(
        matty.appendLog(token1Id, logChineseExceeds)
      ).to.be.revertedWith("log exceeds max length");
    });

    it("Should be unlocked on token transfer", async () => {
      // initial mint
      const [owner, receiver] = await ethers.getSigners();
      const token1Id = 1;
      const matty = await deployMatty();
      await matty.batchMint([owner.address]);

      const log =
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry.";
      await matty.appendLog(token1Id, log);

      // transfer
      await matty.transferFrom(owner.address, receiver.address, token1Id);

      // appendable if it's unlocked
      await matty.connect(receiver).appendLog(token1Id, log);

      // locked again
      const receiverLogbook = await matty
        .connect(receiver)
        .readLogbook(token1Id);
      expect(receiverLogbook.logs.length).to.equal(2);
      expect(receiverLogbook.isLocked).to.equal(true);
    });
  });
});