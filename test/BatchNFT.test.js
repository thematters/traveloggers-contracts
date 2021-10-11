const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const { ethers } = require("hardhat");

const { createAddresses, toGasCost } = require("./utils");

chai.use(chaiAsPromised);
const { expect } = chai;

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

  it("Can read or write base URI", async () => {
    // get contract URI
    const contractURI = await this.batchNFT.contractURI();
    expect(contractURI).to.be.a("string");

    // set new sharedBaseURI
    const uri = "ipfs://QmeEpVThsuHRUDAQccP52WV9xLa2y8LEpTnyEsPX9fp123/";
    await this.batchNFT.setSharedBaseURI(uri);

    // get new contract URI
    const newContractURI = await this.batchNFT.contractURI();
    expect(newContractURI).to.equal(uri + "contract-metadata.json");
  });

  it("Can batch mint to a list of accounts", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply - 1;

    const addressList = createAddresses(amount);

    const tx = await this.batchNFT.batchMint(addressList);

    // test first one and last one
    expect(await this.batchNFT.ownerOf(1)).to.equal(addressList[0]);
    expect(await this.batchNFT.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    );

    // assuming base fee + tip ~ 100 gwei
    const { gasUsed } = await tx.wait();
    console.log(
      `        Gas used for minting ${amount} NFTs in batch: ${gasUsed}. Estimated ETH: ${toGasCost(
        gasUsed
      )}`
    );
  });

  it("Require enough token supply left", async () => {
    // account test list, repeating with the same account
    const amount = totalSupply + 1;

    const addressList = createAddresses(amount);

    await expect(this.batchNFT.batchMint(addressList)).to.be.rejectedWith(
      "not enough supply"
    );
  });
});
