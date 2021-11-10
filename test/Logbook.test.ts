import chai from "chai";
import { ethers } from "hardhat";
import { solidity } from "ethereum-waffle";
import { Contract } from "ethers";

import { toGasCost } from "./utils";

chai.use(solidity);
const { expect } = chai;

let logbookContract: Contract;

describe("Logbook", () => {
  beforeEach(async () => {
    const LogbookFactory = await ethers.getContractFactory("Traveloggers");
    const Logbook = await LogbookFactory.deploy(
      "Logbook_Tester",
      "LTT",
      20,
      "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp3JD/"
    );
    logbookContract = await Logbook.deployed();
  });

  it("Can read or write by token owner", async () => {
    // initial mint
    const [owner] = await ethers.getSigners();
    const token1Id = 1;
    await logbookContract.batchMint([owner.address], 1);

    // append log
    const log =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry standard dummy text ever since.";

    const tx = await logbookContract.appendLog(token1Id, log);

    // "LogbookNewLog" event is emitted
    await expect(tx)
      .to.emit(logbookContract, "LogbookNewLog")
      .withArgs(token1Id, 0, owner.address);

    // assuming base fee + tip ~ 100 gwei
    const { gasUsed } = await tx.wait();
    console.log(
      `        Gas used for appendLog with ${
        log.length
      } characters: ${gasUsed}. Estimated ETH: ${toGasCost(gasUsed)}`
    );

    // logbook is locked now
    const logbook = await logbookContract.readLogbook(token1Id);
    expect(logbook.isLocked).to.equal(true);

    // latest log is sent by token owner
    const [latestLog] = logbook.logs.slice(-1);
    expect(latestLog.sender).to.equal(owner.address);
    expect(latestLog.message).to.equal(log);
  });

  it("Can write with other valid string", async () => {
    // initial mint
    const [owner] = await ethers.getSigners();
    const token1Id = 1;
    await logbookContract.batchMint([owner.address], 1);

    // log chinese
    const logChinese =
      "綠正春職外也事歡發是來使要北的玩心回學：活支影現上點人。到送件票有動。手覺內心動之裝放。";
    await logbookContract.appendLog(token1Id, logChinese);
    const logbook = await logbookContract.readLogbook(token1Id);
    const [latestLog] = logbook.logs.slice(-1);
    expect(latestLog.message).to.equal(logChinese);
  });

  it("Can write many times", async () => {
    // initial mint
    const [owner, tempOwner] = await ethers.getSigners();
    const token1Id = 1;
    await logbookContract.batchMint([owner.address], 1);

    // defined a function that unlock logbook through token swapping
    const swapToUnlock = async () => {
      await logbookContract.transferFrom(
        owner.address,
        tempOwner.address,
        token1Id
      );
      await logbookContract
        .connect(tempOwner)
        .transferFrom(tempOwner.address, owner.address, token1Id);
    };

    const asciiChar = "i";
    const cjkChar = "綠";
    const lengths = [50, 140, 300, 500, 1000];

    // ASCII
    for (const len of lengths) {
      const message = new Array(len).fill(asciiChar).join("");
      const tx = await logbookContract.appendLog(token1Id, message);
      // assuming base fee + tip ~ 100 gwei
      const { gasUsed } = await tx.wait();
      console.log(
        `        Gas used for appendLog with ${len} ASCII characters: ${gasUsed}. Estimated ETH: ${toGasCost(
          gasUsed
        )}`
      );
      await swapToUnlock();
    }

    // CJK
    for (const len of lengths) {
      const message = new Array(len).fill(cjkChar).join("");
      const tx = await logbookContract.appendLog(token1Id, message);
      // assuming base fee + tip ~ 100 gwei
      const { gasUsed } = await tx.wait();
      console.log(
        `        Gas used for appendLog with ${len} CJK characters: ${gasUsed}. Estimated ETH: ${toGasCost(
          gasUsed
        )}`
      );
      await swapToUnlock();
    }
  });

  it("Should be unlocked on token transfer", async () => {
    // initial mint
    const [owner, receiver] = await ethers.getSigners();
    const token1Id = 1;
    await logbookContract.batchMint([owner.address], 1);

    const log =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.";
    await logbookContract.appendLog(token1Id, log);

    // transfer
    await logbookContract.transferFrom(
      owner.address,
      receiver.address,
      token1Id
    );

    // appendable if it's unlocked
    await logbookContract.connect(receiver).appendLog(token1Id, log);

    // locked again
    const receiverLogbook = await logbookContract
      .connect(receiver)
      .readLogbook(token1Id);
    expect(receiverLogbook.logs.length).to.equal(2);
    expect(receiverLogbook.isLocked).to.equal(true);
  });
});
