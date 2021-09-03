import { expect } from "chai";
import { BigNumber } from "ethers";
import { AbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const DesignatedTokenBalance = BigNumber.from(10).pow(18).mul(5); // Equal to 5
const RandomTokenOneBalance = BigNumber.from(10).pow(6).mul(10); //  Equal to 100
const RandomTokenTwoBalance = BigNumber.from(10).pow(12).mul(10); // Equal to 100

describe("Exit", async () => {
  let initializeParams: string;
  const [user, anotherUser] = waffle.provider.getWallets();

  const setUpToken = deployments.createFixture(async () => {
    const Token = await hre.ethers.getContractFactory("TestToken");

    const designatedToken = await Token.deploy(18);
    const randomTokenOne = await Token.deploy(6);
    const randomTokenTwo = await Token.deploy(12);

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
    await randomTokenOne.mint(executor.address, RandomTokenOneBalance);
    await randomTokenTwo.mint(executor.address, RandomTokenTwoBalance);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupply"
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      DesignatedTokenBalance.mul(5)
    );

    initializeParams = new AbiCoder().encode(
      ["address", "address", "address", "address"],
      [
        executor.address,
        executor.address,
        token.designatedToken.address,
        circulatingSupply.address,
      ]
    );

    return {
      Executor,
      executor,
      randomTokenOne,
      randomTokenTwo,
      circulatingSupply,
      ...token,
    };
  });

  const setupTestWithTestExecutor = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("Exit");
    const module = await Module.deploy(
      base.executor.address,
      base.executor.address,
      base.designatedToken.address,
      base.circulatingSupply.address
    );

    return { ...base, Module, module };
  });

  describe("setUp() ", () => {
    it("throws if module has already been initialized", async () => {
      const { designatedToken, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      const module = await Module.deploy(
        user.address,
        user.address,
        designatedToken.address,
        circulatingSupply.address
      );
      await expect(module.setUp(initializeParams)).to.be.revertedWith(
        "Module is already initialized"
      );
    });

    it("throws if executor is zero address", async () => {
      const { designatedToken, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      await expect(
        Module.deploy(
          user.address,
          AddressZero,
          designatedToken.address,
          circulatingSupply.address
        )
      ).to.be.revertedWith("Executor can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const { designatedToken, executor, circulatingSupply } =
        await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      const module = await Module.deploy(
        executor.address,
        executor.address,
        designatedToken.address,
        circulatingSupply.address
      );

      await module.deployed();

      await expect(module.deployTransaction)
        .to.emit(module, "SafeExitModuleSetup")
        .withArgs(user.address, executor.address);
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
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
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
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });

  describe("exit()", () => {
    it("throws if token is added in denied tokens list", async () => {
      const {
        executor,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenOne.address],
      ]);
      await executor.exec(module.address, 0, data);
      await executor.setModule(module.address);
      await designatedToken
        .connect(user)
        .approve(executor.address, DesignatedTokenBalance);

      await expect(
        module.exit(DesignatedTokenBalance, [
          randomTokenOne.address,
          randomTokenTwo.address,
        ])
      ).to.be.revertedWith(`Invalid token`);
    });

    it("throws because user is trying to redeem more tokens than he owns", async () => {
      const { executor, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestExecutor();
      await executor.setModule(module.address);
      await expect(
        module
          .connect(user)
          .exit(DesignatedTokenBalance.mul(2), [
            randomTokenOne.address,
            randomTokenTwo.address,
          ])
      ).to.be.revertedWith("Amount to redeem is greater than balance");
    });

    it("user should receive 20% of safe assets because he is redeeming 1/5 of the circulating supply", async () => {
      const {
        executor,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestExecutor();
      await executor.setModule(module.address);

      await designatedToken
        .connect(user)
        .approve(executor.address, DesignatedTokenBalance);

      const oldBalanceExec = await randomTokenOne.balanceOf(executor.address);
      const oldUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const oldUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      expect(oldBalanceExec).to.be.equal(RandomTokenOneBalance);
      expect(oldUserBalanceInRandomTokenOne).to.be.equal(BigNumber.from(0));
      expect(oldUserBalanceInRandomTokenTwo).to.be.equal(BigNumber.from(0));

      const exitTransaction = await module
        .connect(user)
        .exit(DesignatedTokenBalance, [
          randomTokenOne.address,
          randomTokenTwo.address,
        ]);

      const receipt = await exitTransaction.wait();

      const newBalanceExec = await randomTokenOne.balanceOf(executor.address);

      const newUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const newUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      const newLeaverBalance = await designatedToken.balanceOf(user.address);
      const newOwnerBalance = await designatedToken.balanceOf(executor.address);

      // 4/5 of the random token total supply
      expect(newBalanceExec).to.be.equal(
        RandomTokenOneBalance.mul(800).div(1000)
      );
      // 1/5 of the random token total supply
      expect(newUserBalanceInRandomTokenOne).to.be.equal(
        RandomTokenOneBalance.mul(200).div(1000)
      );
      // 1/5 of the random token total supply
      expect(newUserBalanceInRandomTokenTwo).to.be.equal(
        RandomTokenTwoBalance.mul(200).div(1000)
      );
      expect(newLeaverBalance.toNumber()).to.be.equal(0);
      expect(newOwnerBalance).to.be.equal(DesignatedTokenBalance);

      expect(receipt.events[4].args[0]).to.be.equal(user.address);
    });

    it("user should receive 10% of safe assets because he is redeeming 1/10 of the circulating supply", async () => {
      const {
        executor,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestExecutor();
      await executor.setModule(module.address);

      await designatedToken
        .connect(user)
        .approve(executor.address, DesignatedTokenBalance);

      const oldBalanceExec = await randomTokenOne.balanceOf(executor.address);
      const oldUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const oldUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      expect(oldBalanceExec).to.be.equal(RandomTokenOneBalance);
      expect(oldUserBalanceInRandomTokenOne).to.be.equal(BigNumber.from(0));
      expect(oldUserBalanceInRandomTokenTwo).to.be.equal(BigNumber.from(0));
      const exitTransaction = await module
        .connect(user)
        .exit(DesignatedTokenBalance.div(2), [
          randomTokenOne.address,
          randomTokenTwo.address,
        ]);

      const receipt = await exitTransaction.wait();

      const newBalanceExec = await randomTokenOne.balanceOf(executor.address);

      const newUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const newUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );
      const newLeaverBalance = await designatedToken.balanceOf(user.address);
      const newOwnerBalance = await designatedToken.balanceOf(executor.address);

      // 9/10 of the random token total supply
      expect(newBalanceExec).to.be.equal(
        RandomTokenOneBalance.mul(900).div(1000)
      );

      // 1/10 of the random token total supply
      expect(newUserBalanceInRandomTokenOne).to.be.equal(
        RandomTokenOneBalance.mul(100).div(1000)
      );

      // 1/10 of the random token total supply
      expect(newUserBalanceInRandomTokenTwo).to.be.equal(
        RandomTokenTwoBalance.mul(100).div(1000)
      );

      expect(newLeaverBalance).to.be.equal(DesignatedTokenBalance.div(2));
      expect(newOwnerBalance).to.be.equal(DesignatedTokenBalance.div(2));

      expect(receipt.events[4].args[0]).to.be.equal(user.address);
    });

    it("throws because user haven't approve designated tokens", async () => {
      const { executor, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestExecutor();
      await executor.setModule(module.address);

      await expect(
        module
          .connect(user)
          .exit(DesignatedTokenBalance, [
            randomTokenOne.address,
            randomTokenTwo.address,
          ])
      ).to.be.revertedWith("Error on exit execution");
    });
  });

  describe("setCirculatingSupply", () => {
    const NEW_BALANCE = BigNumber.from(10000000);
    it("should update circulating supply ", async () => {
      const { module, circulatingSupply } = await setupTestWithTestExecutor();
      const currentCirculatingSupply = await module.getCirculatingSupply();
      expect(DesignatedTokenBalance.mul(5)).to.be.equal(
        currentCirculatingSupply
      );
      await circulatingSupply.connect(user).set(NEW_BALANCE);
      const newCirculatingSupply = await module.getCirculatingSupply();
      expect(NEW_BALANCE).to.be.equal(newCirculatingSupply);
    });

    it("throws if not authorized", async () => {
      const { circulatingSupply } = await setupTestWithTestExecutor();
      await expect(
        circulatingSupply.connect(anotherUser).set(NEW_BALANCE)
      ).to.be.revertedWith(`caller is not the owner`);
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

    it("throws if executor is msg.sender is not the executor", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.setDesignatedToken(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should renounce to ownership", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("renounceOwnership", []);

      const oldOwner = await module.owner();
      expect(oldOwner).to.be.equal(executor.address);

      await executor.exec(module.address, 0, data);

      const newOwner = await module.owner();
      expect(newOwner).to.be.equal(AddressZero);
    });

    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.renounceOwnership()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("setAvatar", () => {
    it("should update executor", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("setAvatar", [
        user.address,
      ]);

      const oldExecutor = await module.avatar();
      expect(oldExecutor).to.be.equal(executor.address);

      await executor.exec(module.address, 0, data);

      const newExecutor = await module.avatar();
      expect(newExecutor).to.be.equal(user.address);
    });
    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.setAvatar(user.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("transferOwnership", () => {
    it("should transfer ownership", async () => {
      const { module, executor } = await setupTestWithTestExecutor();
      const data = module.interface.encodeFunctionData("transferOwnership", [
        user.address,
      ]);

      const oldOwner = await module.owner();
      expect(oldOwner).to.be.equal(executor.address);

      await executor.exec(module.address, 0, data);

      const newOwner = await module.owner();
      expect(newOwner).to.be.equal(user.address);
    });

    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestExecutor();
      await expect(module.transferOwnership(user.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
