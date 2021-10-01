const chai = require("chai")
const Web3 = require("web3")
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

  it("Can start and end pre-ordering", async function() {

      // start pre-order 
      let started = await this.matty.inPreOrder()
      expect(started).to.equal(false)

      // cannot start pre-order if minimum contribution amount <= 0
      await expect(this.matty.startPreOrder(0, 100)).to.be.reverted
      // cannot start pre-order if participants allowed <= 0
      await expect(this.matty.startPreOrder(web3.utils.toWei("0.1", "ether"), 0)).to.be.reverted

      // set minimum contribution amount 
      await this.matty.startPreOrder(web3.utils.toWei("0.1", "ether"), 100)
      let minAmount = await this.matty.minAmount()
      expect(minAmount.toString()).to.equal(web3.utils.toWei("0.1", "ether"))
      let participantsAllowed = await this.matty.participantsAllowed()
      expect(participantsAllowed.toString()).to.equal("100")
      started = await this.matty.inPreOrder()
      expect(started).to.equal(true)

      // cannot start again if already started
      await expect(this.matty.startPreOrder(web3.utils.toWei("0.8", "ether"), 100)).to.be.reverted
      
      // close pre-order & restart it
      await this.matty.endPreOrder()
      started = await this.matty.inPreOrder()
      expect(started).to.equal(false)
      await this.matty.startPreOrder(web3.utils.toWei("0.5", "ether"), 100)
      started = await this.matty.inPreOrder()
      expect(started).to.equal(true)
  })

  it("Participants can participate pre-ordering", async function() {
      // pre-order not started
      await expect(this.matty.preOrder({
        from: accounts[0],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      // start pre-order round 1
      await this.matty.startPreOrder(web3.utils.toWei("0.5", "ether"), 100)
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
      await this.matty.endPreOrder()
      await expect(this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      // start pre-order round 2
      await this.matty.startPreOrder(web3.utils.toWei("0.51", "ether"), 100)
      // cannot pre-order is sent amount is less then minimum contribution required
      await expect(this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.5", "ether")
      })).to.be.reverted

      await this.matty.preOrder({
        from: accounts[1],
        value: web3.utils.toWei("0.52", "ether")
      })

      // query pre-order status
      let status = await this.matty.preOrderQuery(accounts[0])
      expect(status).to.equal(true)
      status = await this.matty.preOrderQuery(accounts[1])
      expect(status).to.equal(true)
      status = await this.matty.preOrderQuery(accounts[3])
      expect(status).to.equal(false)
  })

  it("Pre-ordering participants limit cannot be exceeded", async function() {

      // max participants allowed is 9
      await this.matty.startPreOrder(web3.utils.toWei("0.1", "ether"), 9)

      for (let i = 0; i < accounts.length - 1; i++) {
        await this.matty.preOrder({
          from: accounts[i],
          value: web3.utils.toWei("0.1", "ether")
        })
      }

      await expect(this.matty.preOrder({
        from: accounts[9],
        value: web3.utils.toWei("0.1", "ether")
      })).to.be.reverted
  })

})