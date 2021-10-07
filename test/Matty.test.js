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

  it("Can read or write logbook", async () => {
    const [owner] = await ethers.getSigners();
    const ownerAddress = owner.address;

    await this.matty.batchMint([ownerAddress]);

    // append log
    const log =
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry.";
    await this.matty.appendLog(1, log);

    // check event
    const logs = await this.matty.queryFilter("LogbookNewLog");
    const { tokenId, sender } = logs[0].args;
    expect(tokenId.toNumber()).to.equal(1);
    expect(sender).to.equal(ownerAddress);

    // TODO: check logs

    // TODO: check isLock
  });
});
