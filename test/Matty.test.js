const { expect } = require("chai");

const { createAddresses } = require("./utils");

// Start test block
describe("Matty", () => {
  before(async () => {
    this.Matty = await ethers.getContractFactory("Matty");
  });

  beforeEach(async () => {
    this.matty = await this.Matty.deploy();
    await this.matty.deployed();
  });

  it("Can draw lottery from a list of accounts", async () => {
    // account test list, repeating with the same account
    const candidateAmount = 500;
    const winnerAmount = 10;

    const addressList = createAddresses(candidateAmount);

    await this.matty.drawLottery(addressList, winnerAmount);

    // get emitted event
    const logs = await this.matty.queryFilter("LotteryWinners");
    const { winners } = logs[0].args;

    expect(await this.matty.ownerOf(1)).to.equal(winners[0]);
    expect(await this.matty.ownerOf(winnerAmount)).to.equal(
      winners[winners.length - 1]
    );
  });

  it("Can random draw from a list of accounts without duplicates", async () => {
    const amount = 10;
    const addressList = createAddresses(10);

    const result = await this.matty._randomDraw(addressList, amount);

    // should be no duplication in result
    expect(new Set(result).size).to.equal(result.length);
  });

  it("Can get or update baseURI", async () => {
    // get contract URI
    const contractURI = await this.matty.contractURI();
    expect(contractURI).to.be.a("string");

    // set new baseURI
    const uri = "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp123/";
    await this.matty.setBaseURI(uri);

    // get new contract URI
    const newContractURI = await this.matty.contractURI();
    expect(newContractURI).to.equal(uri + "contract-metadata.json");
  });

  it("Can read or write logbook by token owner", async () => {
    // initial mint
    const [owner, receiver, attacker] = await ethers.getSigners();
    const token1Id = 1;
    await this.matty.batchMint([owner.address]);

    // append log
    const log =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.";
    await this.matty.appendLog(token1Id, log);

    // logbook is locked
    const logbook = await this.matty.readLogbook(token1Id);
    expect(logbook.isLocked).to.equal(true);

    // and latest log should be sent by token owner
    const [latestLog] = logbook.logs.slice(-1);
    expect(latestLog.sender).to.equal(owner.address);
    expect(latestLog.log).to.equal(log);

    // "LogbookNewLog" event is emitted
    const logs = await this.matty.queryFilter("LogbookNewLog");
    const { tokenId, sender } = logs[0].args;
    expect(tokenId.toNumber()).to.equal(token1Id);
    expect(sender).to.equal(owner.address);

    // transfer and logbook should be unlocked
    await this.matty.transferFrom(owner.address, receiver.address, token1Id);
    await this.matty.connect(receiver).appendLog(token1Id, log);
    const receiverLogbook = await this.matty
      .connect(receiver)
      .readLogbook(token1Id);
    expect(receiverLogbook.logs.length).to.equal(2);
    expect(receiverLogbook.isLocked).to.equal(true);

    // malicious account tries to read and write logbook
    await this.matty
      .connect(receiver)
      .transferFrom(receiver.address, owner.address, token1Id);
    await expect(
      this.matty.connect(attacker).readLogbook(token1Id)
    ).to.be.rejectedWith("caller is not owner nor approved");
  });
});
