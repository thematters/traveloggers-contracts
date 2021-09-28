const chai = require("chai")
const web3 = require("web3")
const { expect } = require("chai")
const { solidity } = require("ethereum-waffle")

chai.use(solidity)

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

  it("start pre-order with correct round", async function() {
      await expect(this.matty.startPreOrder(0)).to.be.reverted
      await expect(this.matty.startPreOrder(2)).to.be.reverted

      // start pre-order round 1
      let started = await this.matty.inPreOrder()
      expect(started).to.equal(false)
      await this.matty.startPreOrder(1)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(true)

      await expect(this.matty.startPreOrder(2)).to.be.reverted
      await expect(this.matty.endPreOrder(2)).to.be.reverted
      
      // close pre-order round 1 & restart it
      await this.matty.endPreOrder(1)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(false)
      await this.matty.startPreOrder(1)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(true)

      // close pre-order round 1 & start round 2
      await this.matty.endPreOrder(1)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(false)
      await this.matty.startPreOrder(2)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(true)
      
      const round = await this.matty.currentRound()
      expect(round.toNumber()).to.equal(2)
      await this.matty.endPreOrder(2)
      await expect(this.matty.currentRound()).to.be.reverted
  })

  it("pre-ordering", async function() {
      // pre-order not started
      await expect(this.matty.preOrder({
        from: accounts[0],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      // start pre-order round 1
      await this.matty.startPreOrder(1)
      // success pre-order
      await this.matty.preOrder({
        from: accounts[0],
        value: web3.utils.toWei("0.5", "ether")
      })
      // no duplicated pre-ordering
      await expect(this.matty.preOrder({
        from: accounts[0],
        value: web3.utils.toWei("1.5", "ether")
      })).to.be.reverted

      // pre-order closed
      await this.matty.endPreOrder(1)
      await expect(this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      // start pre-order round 2
      await this.matty.startPreOrder(2)
      await this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.5", "ether")
      })

      // still, no duplicate order from acount 0
      await expect(this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      // query pre-order status
      let status = await this.matty.preOrderQuery(accounts[0])
      expect(status).to.equal(true)
      status = await this.matty.preOrderQuery(accounts[1])
      expect(status).to.equal(true)
      status = await this.matty.preOrderQuery(accounts[3])
      expect(status).to.equal(false)

      //TODO: batch add more pre-orders for more testing
  })
})