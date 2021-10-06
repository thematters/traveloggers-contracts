const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const { createAddresses, gasPrice } = require("./utils");

chai.use(chaiAsPromised);
const { expect, assert } = chai;

const totalSupply = 20;

// Start test block
describe("BatchNFT", () => {
  before(async () => {
    this.BatchNFT = await ethers.getContractFactory("BatchNFT");
  });

  beforeEach(async () => {
    this.batchNFT = await this.BatchNFT.deploy("Tester", "TT", totalSupply);
    await this.batchNFT.deployed();
  });

  it("Can batch mint to a list of accounts", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply - 1;

    const addressList = createAddresses(amount);

    const tx = await this.batchNFT.batchMint(addressList);

    const { gasUsed } = await tx.wait();

    // test first one and last one
    expect(await this.batchNFT.ownerOf(1)).to.equal(addressList[0]);
    expect(await this.batchNFT.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    );

    // assuming base fee + tip ~ 100 gwei
    console.log(
      `        Gas used for minting ${amount} NFTs in batch: ${gasUsed}. Estimated ETH: ${
        gasUsed * gasPrice * 0.000000001
      }`
    );
  });

  it("Require enough token supply left", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply + 1;

    const addressList = createAddresses(amount);

    try {
      await this.batchNFT.batchMint(addressList);
      assert.fail("should throw error");
    } catch (error) {
      console.log(error.message);
      assert.isAbove(
        error.message.search("not enough supply"),
        -1,
        `"not enough supply" error must be returned`
      );
    }
  });
});
