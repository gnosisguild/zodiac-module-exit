import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { deployments, waffle } from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const DesignatedTokenBalance = BigNumber.from(1000000);
const RandomTokensBalance = BigNumber.from(1000000000);

describe("SafeExit", async () => {
  const [user] = waffle.provider.getWallets();

  const setUpToken = deployments.createFixture(async () => {
    const Token = await hre.ethers.getContractFactory("TestToken");

    const designatedToken = await Token.deploy();
    const randomTokenOne = await Token.deploy();
    const randomTokenTwo = await Token.deploy();

    await designatedToken.mint(user.address, DesignatedTokenBalance);
    return {
      randomTokenOne,
      randomTokenTwo,
      Token,
      designatedToken,
    };
  });

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const { randomTokenOne, randomTokenTwo, ...token } = await setUpToken();
    const Executor = await hre.ethers.getContractFactory("TestExecutor");
    const executor = await Executor.deploy();

    await randomTokenOne.mint(executor.address, RandomTokensBalance);
    await randomTokenTwo.mint(executor.address, RandomTokensBalance);

    return {
      Executor,
      executor,
      randomTokenOne,
      randomTokenTwo,
      ...token,
    };
  });

  const setupTestWithTestExecutor = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("SafeExit");
    const module = await Module.deploy(
      AddressZero,
      base.designatedToken.address,
      DesignatedTokenBalance
    );

    await module.setUp(
      base.executor.address,
      base.designatedToken.address,
      DesignatedTokenBalance.mul(4)
    );
    return { ...base, Module, module };
  });

  describe("setUp() ", () => {
    it("throws if module has already been initialized", async () => {
      const { designatedToken } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("SafeExit");
      const module = await Module.deploy(
        user.address,
        designatedToken.address,
        DesignatedTokenBalance
      );
      await expect(
        module.setUp(
          user.address,
          designatedToken.address,
          DesignatedTokenBalance
        )
      ).to.be.revertedWith("Module is already initialized");
    });

    it("throws if designated token address is zero", async () => {
      const Module = await hre.ethers.getContractFactory("SafeExit");
      await expect(
        Module.deploy(AddressZero, AddressZero, DesignatedTokenBalance)
      ).to.be.revertedWith("Designated token can not be zero");
    });

    it("should emit event because of successful set up", async () => {
      const { designatedToken, executor } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("SafeExit");
      const module = await Module.deploy(
        AddressZero,
        designatedToken.address,
        DesignatedTokenBalance
      );

      const setupTx = await module.setUp(
        executor.address,
        designatedToken.address,
        DesignatedTokenBalance
      );
      const transaction = await setupTx.wait();

      const [initiator, safe] = transaction.events[0].args;

      expect(safe).to.be.equal(executor.address);
      expect(initiator).to.be.equal(user.address);
    });
  });

  describe("addToDenylist()", () => {
    it("should add address to denied list", async () => {
      const { module, executor, randomTokenOne } =
        await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenOne.address],
      ]);
      await executor.exec(module.address, 0, data);
      const moduleIsAdded = await module.deniedTokens(randomTokenOne.address);
      expect(moduleIsAdded).to.be.true;
    });
    it("throws if not authorized", async () => {
      const { module, randomTokenTwo } = await setupTestWithTestExecutor();
      await expect(
        module.addToDenylist([randomTokenTwo.address])
      ).to.be.revertedWith(`Not authorized`);
    });

    it("throws if token is already in list", async () => {
      const { module, executor, randomTokenTwo } =
        await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenTwo.address],
      ]);
      await executor.exec(module.address, 0, data);

      await expect(executor.exec(module.address, 0, data)).to.be.revertedWith(
        `Token already denied`
      );
    });
  });

  describe("removeFromDenylist()", () => {
    it("should remove address from denied list", async () => {
      const { module, executor, randomTokenOne } =
        await setupTestWithTestExecutor();
      const addTokenData = module.interface.encodeFunctionData(
        "addToDenylist",
        [[randomTokenOne.address]]
      );
      await executor.exec(module.address, 0, addTokenData);
      const moduleIsAdded = await module.deniedTokens(randomTokenOne.address);
      expect(moduleIsAdded).to.be.true;
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[randomTokenOne.address]]
      );

      await executor.exec(module.address, 0, removeTokenData);
      const moduleIsNotAdded = await module.deniedTokens(
        randomTokenOne.address
      );
      expect(moduleIsNotAdded).to.be.false;
    });

    it("throws if token is not added in list", async () => {
      const { module, executor, randomTokenTwo } =
        await setupTestWithTestExecutor();
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[randomTokenTwo.address]]
      );
      await expect(
        executor.exec(module.address, 0, removeTokenData)
      ).to.be.revertedWith(`Token not denied`);
    });

    it("throws if not authorized", async () => {
      const { module, randomTokenOne } = await setupTestWithTestExecutor();
      await expect(
        module.removeFromDenylist([randomTokenOne.address])
      ).to.be.revertedWith(`Not authorized`);
    });
  });

  describe("exit()", () => {
    it("throws if token is added in denied tokens list", async () => {
      const { executor, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenOne.address],
      ]);
      await executor.exec(module.address, 0, data);
      await executor.setModule(module.address);

      await expect(
        module.exit([randomTokenOne.address, randomTokenTwo.address])
      ).to.be.revertedWith(`Invalid token`);
    });

    it("should transfer multiple tokens to user and transfer designated token to owner ", async () => {
      const {
        executor,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestExecutor();
      await executor.setModule(module.address);

      const safeExitInstanceSignedByUser = await hre.ethers.getContractAt(
        "SafeExit",
        module.address,
        user
      );

      const testTokenInstanceSignerByUser = await hre.ethers.getContractAt(
        "TestToken",
        designatedToken.address,
        user
      );

      const leaverBalance = await designatedToken.balanceOf(user.address);
      await testTokenInstanceSignerByUser.approve(
        executor.address,
        leaverBalance
      );
      const oldBalanceExec = await randomTokenOne.balanceOf(executor.address);
      const oldUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const oldUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      expect(oldBalanceExec).to.be.equal(RandomTokensBalance);
      expect(oldUserBalanceInRandomTokenOne).to.be.equal(BigNumber.from(0));
      expect(oldUserBalanceInRandomTokenTwo).to.be.equal(BigNumber.from(0));
      expect(leaverBalance.toNumber()).to.be.greaterThan(1);

      const exitTransaction = await safeExitInstanceSignedByUser.exit([
        randomTokenOne.address,
        randomTokenTwo.address,
      ]);

      const receipt = await exitTransaction.wait();

      const newBalanceExec = await randomTokenOne.balanceOf(executor.address);

      // 3/4 of the random token total supply
      const ThreeQuartersRandomTokenTotalSupply = RandomTokensBalance.mul(750)
        .div(1000)
        .toNumber();

      // 1/4 of the random token total supply
      const OneQuarterRandomTokenTotalSupply = RandomTokensBalance.mul(250)
        .div(1000)
        .toNumber();

      const newUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const newUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );
      const newLeaverBalance = await designatedToken.balanceOf(user.address);
      const newOwnerBalance = await designatedToken.balanceOf(executor.address);

      expect(newBalanceExec.toNumber()).to.be.equal(
        ThreeQuartersRandomTokenTotalSupply
      );
      expect(newUserBalanceInRandomTokenOne.toNumber()).to.be.equal(
        OneQuarterRandomTokenTotalSupply
      );
      expect(newUserBalanceInRandomTokenTwo.toNumber()).to.be.equal(
        OneQuarterRandomTokenTotalSupply
      );
      expect(newLeaverBalance.toNumber()).to.be.equal(0);
      expect(newOwnerBalance.toNumber()).to.be.equal(leaverBalance.toNumber());

      expect(receipt.events[4].args[0]).to.be.equal(user.address);
    });

    it("throws because user haven't approve designated tokens", async () => {
      const { executor, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestExecutor();
      await executor.setModule(module.address);

      const safeExitInstanceSignedByUser = await hre.ethers.getContractAt(
        "SafeExit",
        module.address,
        user
      );

      await expect(
        safeExitInstanceSignedByUser.exit([
          randomTokenOne.address,
          randomTokenTwo.address,
        ])
      ).to.be.revertedWith("Error on exit execution");
    });
  });

  describe("setCirculatingSupply", () => {
    const NEW_BALANCE = BigNumber.from(10000000);
    it("should update circulating supply ", async () => {
      const { executor, module } = await setupTestWithTestExecutor();
      const currentCirculatingSupply = await module.getCirculatingSupply();
      expect(DesignatedTokenBalance.mul(4)).to.be.equal(
        currentCirculatingSupply
      );
      const data = module.interface.encodeFunctionData("setCirculatingSupply", [
        NEW_BALANCE,
      ]);
      await executor.exec(module.address, 0, data);
      const newCirculatingSupply = await module.getCirculatingSupply();
      expect(NEW_BALANCE).to.be.equal(newCirculatingSupply);
    });

    it("throws if not authorized", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.setCirculatingSupply(NEW_BALANCE)).to.be.revertedWith(
        `Not authorized`
      );
    });
  });

  describe("getCirculatingSupply", () => {
    it("should return circulating supply ", async () => {
      const { module } = await setupTestWithTestExecutor();
      const circulatingSupply = await module.getCirculatingSupply();
      expect(circulatingSupply).to.be.instanceOf(BigNumber);
    });
  });

  describe("setDesignedToken()", () => {
    it("should set designated token", async () => {
      const { module, executor, randomTokenOne } =
        await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        randomTokenOne.address,
      ]);
      await executor.exec(module.address, 0, data);
      const newTokenAddress = await module.designatedToken();
      expect(newTokenAddress).to.be.equal(randomTokenOne.address);
    });

    it("throws if address is zero", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        AddressZero,
      ]);
      await expect(executor.exec(module.address, 0, data)).to.be.revertedWith(
        "Designated token can not be zero"
      );
    });
  });
});
