const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe
          let deployer
          let mockV3Aggregator
          const sendValue = ethers.utils.parseEther("1")

          beforeEach(async function () {
              // deploy our fundMe contract
              // using Hardhat-deploy
              // const accounts = await ethers.getSigners();
              // const accountZero = accounts[0];
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", async function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed()
                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", async function () {
              it("Fails if you don't send enought ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH"
                  )
              })
              it("updated the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  assert.equal(response.toString(), sendValue.toString)
              })
              it("Adds funder to array to funders", async function () {
                  await fundMe.fund({ value: sendValue })
                  const funder = await fundMe.getFunder(0)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // arrange

                  const startingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // act

                  const txResp = await fundMe.withdraw()
                  const txReceipt = await txResp.wait(1)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // assert
                  assert.equal(endingFundMeBal, 0)
                  assert.equal(
                      startingFundMeBal.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                  }
                  await fundMeConnectedContract.fund({ value: sendValue })

                  const startingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const txResp = await fundMe.withdraw()
                  const txReceipt = await txResp.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  assert.equal(endingFundMeBal, 0)
                  assert.equal(
                      startingFundMeBal.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )

                  //Reset Funders properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      ),
                          0
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })
          })

          describe("optimised withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async function () {
                  // arrange

                  const startingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // act

                  const txResp = await fundMe.optimised_withdraw()
                  const txReceipt = await txResp.wait(1)

                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const endingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // assert
                  assert.equal(endingFundMeBal, 0)
                  assert.equal(
                      startingFundMeBal.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )
              })
              it("allows us to withdraw with multiple funders", async function () {
                  // Arrange
                  const accounts = await ethers.getSigners()
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      )
                  }
                  await fundMeConnectedContract.fund({ value: sendValue })

                  const startingFundMeBal = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  const startingDeployerBal = await fundMe.provider.getBalance(
                      deployer
                  )

                  // Act
                  const txResp = await fundMe.withdraw()
                  const txReceipt = await txResp.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  // Assert
                  assert.equal(endingFundMeBal, 0)
                  assert.equal(
                      startingFundMeBal.add(startingDeployerBal).toString(),
                      endingDeployerBal.add(gasCost).toString()
                  )

                  //Reset Funders properly
                  await expect(fundMe.getFunder(0)).to.be.reverted

                  for (i = 1; i < 6; i++) {
                      await fundMe.getAddressToAmountFunded(
                          accounts[i].address
                      ),
                          0
                  }
              })
              it("Only allows the owner to withdraw", async function () {
                  const accounts = ethers.getSigners()
                  const attacker = accounts[1]
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  )
                  await expect(attackerConnectedContract.withdraw()).to.be
                      .reverted
              })
          })
      })
