const { expect } = require("chai")

// Load compiled artifacts
const Matty = artifacts.require("Matty")

// Start test block
contract("Matty", (accounts) => {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.matty = await Matty.new()
  })

  // Test case
  it("tokenURI returns uri minted", async function () {
    // Test uri
    const uri = "ipfs://some-hash"

    // Mint the first token
    await this.matty.mintTo(accounts[0], uri)

    // Test if the returned value is the same one
    expect((await this.matty.tokenURI(1)).toString()).to.equal(uri)
  })
})
