import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { deployments, waffle } from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const AddressOne = "0x0000000000000000000000000000000000000001";

describe("SafeExit", async () => {
  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const Executor = await hre.ethers.getContractFactory("TestExecutor");
    const executor = await Executor.deploy();
    const Token = await hre.ethers.getContractFactory("TestToken");
    const token = await Token.deploy();
    return { Executor, executor, token, Token };
  });

  const setupTestWithTestExecutor = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("SafeExit");
    const module = await Module.deploy(AddressZero, base.token.address, 1000);
    await module.setUp(base.executor.address, base.token.address, 1000);
    return { ...base, Module, module };
  });

  const [user] = waffle.provider.getWallets();

  describe("setUp() ", () => {
    it("throws if module has already been initialized", async () => {
      const { token } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("SafeExit");
      const module = await Module.deploy(user.address, token.address, 1000);
      await expect(
        module.setUp(user.address, token.address, 1000)
      ).to.be.revertedWith("Module is already initialized");
    });

    it("throws if designated token address is zero", async () => {
      const Module = await hre.ethers.getContractFactory("SafeExit");
      await expect(
        Module.deploy(AddressZero, AddressZero, 1000)
      ).to.be.revertedWith("setUp: Designated token address can not be zero");
    });

    it("should emit event because of successful set up", async () => {
      const { token, executor } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("SafeExit");
      const module = await Module.deploy(AddressZero, token.address, 1000);

      const setupTx = await module.setUp(
        executor.address,
        token.address,
        10000
      );
      const transaction = await setupTx.wait();

      const [initiator, safe] = transaction.events[0].args;

      expect(safe).to.be.equal(executor.address);
      expect(initiator).to.be.equal(user.address);
    });
  });

  describe("addToDenylist()", () => {
    it("should add address to denied list", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [AddressOne],
      ]);
      await executor.exec(module.address, 0, data);
      const moduleIsAdded = await module.deniedTokens(AddressOne);
      expect(moduleIsAdded).to.be.true;
    });
    it("throws if not authorized", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.addToDenylist([AddressOne])).to.be.revertedWith(
        "Not authorized"
      );
    });

    it("throws if token is already in list", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [AddressOne],
      ]);
      await executor.exec(module.address, 0, data);

      await expect(executor.exec(module.address, 0, data)).to.be.revertedWith(
        "addToDenyList: Token already added to the list"
      );
    });
  });

  describe("removeFromDenylist()", () => {
    it("should remove address from denied list", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const addTokenData = module.interface.encodeFunctionData(
        "addToDenylist",
        [[AddressOne]]
      );
      await executor.exec(module.address, 0, addTokenData);
      const moduleIsAdded = await module.deniedTokens(AddressOne);
      expect(moduleIsAdded).to.be.true;
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[AddressOne]]
      );

      await executor.exec(module.address, 0, removeTokenData);
      const moduleIsNotAdded = await module.deniedTokens(AddressOne);
      expect(moduleIsNotAdded).to.be.false;
    });

    it("throws if token is not added in list", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[AddressOne]]
      );
      await expect(
        executor.exec(module.address, 0, removeTokenData)
      ).to.be.revertedWith("removeFromDenylist: Token not added to the list");
    });

    it("throws if not authorized", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.removeFromDenylist([AddressOne])).to.be.revertedWith(
        "Not authorized"
      );
    });
  });

  describe("exit()", () => {
    it("throws if token is in denylist", async () => {
      const { executor, module } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [AddressOne],
      ]);
      await executor.exec(module.address, 0, data);
      await expect(module.exit(1, [AddressOne])).to.be.revertedWith(
        "onlyValidTokens: Invalid token has been sent"
      );
    });
  });

  describe("setCirculatingSupply", () => {
    const OLD_BALANCE = BigNumber.from(1000);
    const NEW_BALANCE = BigNumber.from(10000000);
    it("should update circulating supply ", async () => {
      const { executor, module } = await setupTestWithTestExecutor();
      const currentCirculatingSupply = await module.getCirculatingSupply();
      expect(OLD_BALANCE).to.be.equal(currentCirculatingSupply);
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
        "Not authorized"
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
      const { token, module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        token.address,
      ]);
      await executor.exec(module.address, 0, data);
      const newTokenAddress = await module.designatedToken();
      expect(newTokenAddress).to.be.equal(token.address);
    });

    it("throws if address is zero", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        AddressZero,
      ]);
      await expect(executor.exec(module.address, 0, data)).to.be.revertedWith(
        "setDesignatedToken: Token address can not be zero"
      );
    });
  });
});
