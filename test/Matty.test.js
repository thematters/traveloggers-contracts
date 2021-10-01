const chai = require("chai")
const web3 = require("web3")
const { expect } = require("chai")
const { solidity } = require("ethereum-waffle")

chai.use(solidity)

const { networks } = require("../truffle-config")

const web3 = new Web3(
  `http://${networks.development.host}:${networks.development.port}`
)

// helper function
const createAddresses = (amount) =>
  new Array(amount)
    .fill(undefined)
    .map(() => web3.eth.accounts.create().address)

// Load compiled artifacts
const Matty = artifacts.require("Matty")

// gas price in gwei, includes base fee + tip, used for estimation
const gasPrice = 100

// Start test block
contract("Matty", (accounts) => {
  beforeEach(async function () {
    // Deploy a new contract for each test
    this.matty = await Matty.new()
  })

  it("Can batch drop to a list of accounts", async function () {
    // account test list, repeating with the same account
    const amount = 100

    const addressList = createAddresses(amount)

    const { receipt } = await this.matty.batchDrop(addressList)

    // test first one and last one
    expect(await this.matty.ownerOf(1)).to.equal(addressList[0])
    expect(await this.matty.ownerOf(amount)).to.equal(
      addressList[addressList.length - 1]
    )

    // assuming base fee + tip ~ 100 gwei
    console.log(
      `        Gas used for ${amount} air drops: ${
        receipt.gasUsed
      }. Estimated ETH: ${receipt.gasUsed * gasPrice * 0.000000001}`
    )
  })

  it("Can draw lottery from a list of accounts", async function () {
    // account test list, repeating with the same account
    const candidateAmount = 4000
    const winnerAmount = 50

    const addressList = createAddresses(4000)

    const { logs, receipt } = await this.matty.drawLottery(
      addressList,
      winnerAmount
    )

    const winners = logs.filter(({ event }) => event === "LotteryDraw")[0].args
      .winners

    expect(await this.matty.ownerOf(1)).to.equal(winners[0])
    expect(await this.matty.ownerOf(winnerAmount)).to.equal(
      winners[winners.length - 1]
    )

    // assuming base fee + tip ~ 100 gwei
    console.log(
      `        Gas used for drawing ${winnerAmount} winners from ${candidateAmount} addresses: ${
        receipt.gasUsed
      }. Estimated ETH: ${receipt.gasUsed * gasPrice * 0.000000001}`
    )
  })

  it("Can random draw from a list of accounts without duplicates", async function () {
    const amount = 10
    const addressList = createAddresses(10)

    const result = await this.matty._randomDraw(addressList, amount)

    // should be no duplication in result
    expect(new Set(result).size).to.equal(result.length)
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