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
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    await user.sendTransaction({ to: avatar.address, value: 100 });
    await randomTokenOne.mint(avatar.address, RandomTokenOneBalance);
    await randomTokenTwo.mint(avatar.address, RandomTokenTwoBalance);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupply"
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      DesignatedTokenBalance.mul(5)
    );

    initializeParams = new AbiCoder().encode(
      ["address", "address", "address", "address", "address"],
      [
        avatar.address,
        avatar.address,
        avatar.address,
        token.designatedToken.address,
        circulatingSupply.address,
      ]
    );

    return {
      Avatar,
      avatar,
      randomTokenOne,
      randomTokenTwo,
      circulatingSupply,
      ...token,
    };
  });

  const setupTestWithTestAvatar = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("Exit");
    const module = await Module.deploy(
      base.avatar.address,
      base.avatar.address,
      base.avatar.address,
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
        user.address,
        designatedToken.address,
        circulatingSupply.address
      );
      await expect(module.setUp(initializeParams)).to.be.revertedWith(
        "Module is already initialized"
      );
    });

    it("throws if avatar is zero address", async () => {
      const { designatedToken, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      await expect(
        Module.deploy(
          user.address,
          AddressZero,
          user.address,
          designatedToken.address,
          circulatingSupply.address
        )
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("throws if target is zero address", async () => {
      const { designatedToken, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      await expect(
        Module.deploy(
          user.address,
          user.address,
          AddressZero,
          designatedToken.address,
          circulatingSupply.address
        )
      ).to.be.revertedWith("Target can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const { designatedToken, avatar, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("Exit");
      const module = await Module.deploy(
        avatar.address,
        avatar.address,
        avatar.address,
        designatedToken.address,
        circulatingSupply.address
      );

      await module.deployed();

      await expect(module.deployTransaction)
        .to.emit(module, "ExitModuleSetup")
        .withArgs(user.address, avatar.address);
    });
  });

  describe("addToDenylist()", () => {
    it("should add address to denied list", async () => {
      const { module, avatar, randomTokenOne } =
        await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenOne.address],
      ]);
      await avatar.exec(module.address, 0, data);
      const moduleIsAdded = await module.deniedTokens(randomTokenOne.address);
      expect(moduleIsAdded).to.be.true;
    });
    it("throws if not authorized", async () => {
      const { module, randomTokenTwo } = await setupTestWithTestAvatar();
      await expect(
        module.addToDenylist([randomTokenTwo.address])
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });

    it("throws if token is already in list", async () => {
      const { module, avatar, randomTokenTwo } =
        await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenTwo.address],
      ]);
      await avatar.exec(module.address, 0, data);

      await expect(avatar.exec(module.address, 0, data)).to.be.revertedWith(
        `Token already denied`
      );
    });
  });

  describe("removeFromDenylist()", () => {
    it("should remove address from denied list", async () => {
      const { module, avatar, randomTokenOne } =
        await setupTestWithTestAvatar();
      const addTokenData = module.interface.encodeFunctionData(
        "addToDenylist",
        [[randomTokenOne.address]]
      );
      await avatar.exec(module.address, 0, addTokenData);
      const moduleIsAdded = await module.deniedTokens(randomTokenOne.address);
      expect(moduleIsAdded).to.be.true;
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[randomTokenOne.address]]
      );

      await avatar.exec(module.address, 0, removeTokenData);
      const moduleIsNotAdded = await module.deniedTokens(
        randomTokenOne.address
      );
      expect(moduleIsNotAdded).to.be.false;
    });

    it("throws if token is not added in list", async () => {
      const { module, avatar, randomTokenTwo } =
        await setupTestWithTestAvatar();
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[randomTokenTwo.address]]
      );
      await expect(
        avatar.exec(module.address, 0, removeTokenData)
      ).to.be.revertedWith(`Token not denied`);
    });

    it("throws if not authorized", async () => {
      const { module, randomTokenOne } = await setupTestWithTestAvatar();
      await expect(
        module.removeFromDenylist([randomTokenOne.address])
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });

  describe("exit()", () => {
    it("throws if token is added in denied tokens list", async () => {
      const {
        avatar,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [randomTokenOne.address],
      ]);
      await avatar.exec(module.address, 0, data);
      await avatar.setModule(module.address);
      await designatedToken
        .connect(user)
        .approve(avatar.address, DesignatedTokenBalance);

      await expect(
        module.exit(DesignatedTokenBalance, [
          randomTokenOne.address,
          randomTokenTwo.address,
        ])
      ).to.be.revertedWith(`Invalid token`);
    });

    it("throws because user is trying to redeem more tokens than he owns", async () => {
      const { avatar, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestAvatar();
      await avatar.setModule(module.address);
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
        avatar,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

      await designatedToken
        .connect(user)
        .approve(avatar.address, DesignatedTokenBalance);

      const oldBalanceExec = await randomTokenOne.balanceOf(avatar.address);
      const oldUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const oldUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(100);
      expect(await waffle.provider.getBalance(avatar.address)).to.be.equal(
        BigNumber.from(100)
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

      const newBalanceExec = await randomTokenOne.balanceOf(avatar.address);

      const newUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const newUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );

      const newLeaverBalance = await designatedToken.balanceOf(user.address);
      const newOwnerBalance = await designatedToken.balanceOf(avatar.address);

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
      // 1/5 of the ETH balance
      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(80);

      expect(newLeaverBalance.toNumber()).to.be.equal(0);
      expect(newOwnerBalance).to.be.equal(DesignatedTokenBalance);

      expect(receipt.events[4].args[0]).to.be.equal(user.address);
    });

    it("user should receive 10% of safe assets because he is redeeming 1/10 of the circulating supply", async () => {
      const {
        avatar,
        module,
        randomTokenOne,
        randomTokenTwo,
        designatedToken,
      } = await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

      await designatedToken
        .connect(user)
        .approve(avatar.address, DesignatedTokenBalance);

      const oldBalanceExec = await randomTokenOne.balanceOf(avatar.address);
      const oldUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const oldUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );
      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(100);

      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(100);
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

      const newBalanceExec = await randomTokenOne.balanceOf(avatar.address);

      const newUserBalanceInRandomTokenOne = await randomTokenOne.balanceOf(
        user.address
      );
      const newUserBalanceInRandomTokenTwo = await randomTokenTwo.balanceOf(
        user.address
      );
      const newLeaverBalance = await designatedToken.balanceOf(user.address);
      const newOwnerBalance = await designatedToken.balanceOf(avatar.address);

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

      // 1/10 of ETH balance
      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(90);

      expect(newLeaverBalance).to.be.equal(DesignatedTokenBalance.div(2));
      expect(newOwnerBalance).to.be.equal(DesignatedTokenBalance.div(2));

      expect(receipt.events[4].args[0]).to.be.equal(user.address);
    });

    it("throws because user haven't approve designated tokens", async () => {
      const { avatar, module, randomTokenOne, randomTokenTwo } =
        await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

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
      const { module, circulatingSupply } = await setupTestWithTestAvatar();
      const currentCirculatingSupply = await module.getCirculatingSupply();
      expect(DesignatedTokenBalance.mul(5)).to.be.equal(
        currentCirculatingSupply
      );
      await circulatingSupply.connect(user).set(NEW_BALANCE);
      const newCirculatingSupply = await module.getCirculatingSupply();
      expect(NEW_BALANCE).to.be.equal(newCirculatingSupply);
    });

    it("throws if not authorized", async () => {
      const { circulatingSupply } = await setupTestWithTestAvatar();
      await expect(
        circulatingSupply.connect(anotherUser).set(NEW_BALANCE)
      ).to.be.revertedWith(`caller is not the owner`);
    });
  });

  describe("getCirculatingSupply", () => {
    it("should return circulating supply ", async () => {
      const { module } = await setupTestWithTestAvatar();
      const circulatingSupply = await module.getCirculatingSupply();
      expect(circulatingSupply).to.be.instanceOf(BigNumber);
    });
  });

  describe("setDesignedToken()", () => {
    it("should set designated token", async () => {
      const { module, avatar, randomTokenOne } =
        await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        randomTokenOne.address,
      ]);
      await avatar.exec(module.address, 0, data);
      const newTokenAddress = await module.designatedToken();
      expect(newTokenAddress).to.be.equal(randomTokenOne.address);
    });

    it("throws if avatar is msg.sender is not the avatar", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setDesignatedToken(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("renounceOwnership", () => {
    it("should renounce to ownership", async () => {
      const { module, avatar } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("renounceOwnership", []);

      const oldOwner = await module.owner();
      expect(oldOwner).to.be.equal(avatar.address);

      await avatar.exec(module.address, 0, data);

      const newOwner = await module.owner();
      expect(newOwner).to.be.equal(AddressZero);
    });

    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.renounceOwnership()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("setAvatar", () => {
    it("should update avatar", async () => {
      const { module, avatar } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("setAvatar", [
        user.address,
      ]);

      const oldAvatar = await module.avatar();
      expect(oldAvatar).to.be.equal(avatar.address);

      await avatar.exec(module.address, 0, data);

      const newAvatar = await module.avatar();
      expect(newAvatar).to.be.equal(user.address);
    });
    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setAvatar(user.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("transferOwnership", () => {
    it("should transfer ownership", async () => {
      const { module, avatar } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("transferOwnership", [
        user.address,
      ]);

      const oldOwner = await module.owner();
      expect(oldOwner).to.be.equal(avatar.address);

      await avatar.exec(module.address, 0, data);

      const newOwner = await module.owner();
      expect(newOwner).to.be.equal(user.address);
    });

    it("throws because its not being called by owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.transferOwnership(user.address)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
