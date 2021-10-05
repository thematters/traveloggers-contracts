const chai = require("chai")
const chaiAsPromised = require("chai-as-promised")

const { createAddresses, gasPrice } = require("./utils")

chai.use(chaiAsPromised)
const { expect, assert } = chai

// Load compiled artifacts
const BatchNFT = artifacts.require("BatchNFT")

const totalSupply = 20

// Start test block
contract("BatchNFT", (accounts) => {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.batchNFT = await BatchNFT.new("Tester", "TT", totalSupply)
  })

  it("Can batch mint to a list of accounts", async function () {
    // account test list, repeating with the same account
    const amount = totalSupply - 1

    const addressList = createAddresses(amount)

    const { receipt } = await this.batchNFT.batchMint(addressList)

    // test first one and last one
    expect(await this.batchNFT.ownerOf(1)).to.equal(addressList[0])
    expect(await this.batchNFT.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    )

    // assuming base fee + tip ~ 100 gwei
    console.log(
      `        Gas used for minting ${amount} NFTs in batch: ${
        receipt.gasUsed
      }. Estimated ETH: ${receipt.gasUsed * gasPrice * 0.000000001}`
    )
  })

  it("Require enough token supply left", async function () {
    // account test list, repeating with the same account
    const amount = totalSupply + 1

    const addressList = createAddresses(amount)

    try {
      await this.batchNFT.batchMint(addressList)
      assert.fail("should throw error")
    } catch (error) {
      console.log(error.message)
      assert.isAbove(
        error.message.search("not enough supply"),
        -1,
        `"not enough supply" error must be returned`
      )
    }
  })
})
