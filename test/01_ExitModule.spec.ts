import { expect } from "chai";
import { BigNumber } from "ethers";
import { AbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const DesignatedTokenBalance = BigNumber.from(10).pow(18).mul(5); // Equal to 5
const TokenOneBalance = BigNumber.from(10).pow(6).mul(10); //  Equal to 100
const TokenTwoBalance = BigNumber.from(10).pow(12).mul(10); // Equal to 100

describe("Exit", async () => {
  let initializeParams: string;
  const [user, anotherUser] = waffle.provider.getWallets();

  const setUpToken = deployments.createFixture(async () => {
    const Token = await hre.ethers.getContractFactory("TestToken");

    const designatedToken = await Token.deploy(18);
    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);

    const tokensOrdered = [tokenOne.address, tokenTwo.address].sort(
      (a, b) => Number(a) - Number(b)
    );
    await designatedToken.mint(user.address, DesignatedTokenBalance);
    return {
      tokenOne,
      tokenTwo,
      Token,
      designatedToken,
      tokensOrdered,
    };
  });

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const { tokenOne, tokenTwo, ...token } = await setUpToken();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    token.designatedToken.mint(
      anotherUser.address,
      DesignatedTokenBalance.mul(4)
    );
    await user.sendTransaction({ to: avatar.address, value: 100 });
    await tokenOne.mint(avatar.address, TokenOneBalance);
    await tokenTwo.mint(avatar.address, TokenTwoBalance);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupply"
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      user.address,
      token.designatedToken.address,
      [avatar.address]
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
      tokenOne,
      tokenTwo,
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
        "Initializable: contract is already initialized"
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
      const { module, avatar, tokenOne } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [tokenOne.address],
      ]);
      await avatar.exec(module.address, 0, data);
      const moduleIsAdded = await module.deniedTokens(tokenOne.address);
      expect(moduleIsAdded).to.be.true;
    });
    it("throws if not authorized", async () => {
      const { module, tokenTwo } = await setupTestWithTestAvatar();
      await expect(module.addToDenylist([tokenTwo.address])).to.be.revertedWith(
        `Ownable: caller is not the owner`
      );
    });

    it("throws if token is already in list", async () => {
      const { module, avatar, tokenTwo } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [tokenTwo.address],
      ]);
      await avatar.exec(module.address, 0, data);

      await expect(avatar.exec(module.address, 0, data)).to.be.revertedWith(
        `Token already denied`
      );
    });
  });

  describe("removeFromDenylist()", () => {
    it("should remove address from denied list", async () => {
      const { module, avatar, tokenOne } = await setupTestWithTestAvatar();
      const addTokenData = module.interface.encodeFunctionData(
        "addToDenylist",
        [[tokenOne.address]]
      );
      await avatar.exec(module.address, 0, addTokenData);
      const moduleIsAdded = await module.deniedTokens(tokenOne.address);
      expect(moduleIsAdded).to.be.true;
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[tokenOne.address]]
      );

      await avatar.exec(module.address, 0, removeTokenData);
      const moduleIsNotAdded = await module.deniedTokens(tokenOne.address);
      expect(moduleIsNotAdded).to.be.false;
    });

    it("throws if token is not added in list", async () => {
      const { module, avatar, tokenTwo } = await setupTestWithTestAvatar();
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenylist",
        [[tokenTwo.address]]
      );
      await expect(
        avatar.exec(module.address, 0, removeTokenData)
      ).to.be.revertedWith(`Token not denied`);
    });

    it("throws if not authorized", async () => {
      const { module, tokenOne } = await setupTestWithTestAvatar();
      await expect(
        module.removeFromDenylist([tokenOne.address])
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });

  describe("exit()", () => {
    it("throws if token is added in denied tokens list", async () => {
      const { avatar, module, tokenOne, tokenTwo, designatedToken } =
        await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [tokenOne.address],
      ]);
      await avatar.exec(module.address, 0, data);

      await avatar.setModule(module.address);
      await designatedToken.approve(module.address, DesignatedTokenBalance);

      await expect(
        module.exit(DesignatedTokenBalance, [
          tokenOne.address,
          tokenTwo.address,
        ])
      ).to.be.revertedWith(`Denied token`);
    });

    it("throws if designated token is in list", async () => {
      const { avatar, module, tokenOne, tokenTwo, designatedToken } =
        await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("addToDenylist", [
        [tokenOne.address],
      ]);
      await avatar.exec(module.address, 0, data);

      await avatar.setModule(module.address);
      await designatedToken.approve(module.address, DesignatedTokenBalance);

      await expect(
        module.exit(DesignatedTokenBalance, [designatedToken.address])
      ).to.be.revertedWith(`Denied token`);
    });

    it("throws because user is trying to redeem more tokens than he owns", async () => {
      const { avatar, module, tokensOrdered } = await setupTestWithTestAvatar();
      await avatar.setModule(module.address);
      await expect(
        module.exit(DesignatedTokenBalance.mul(2), tokensOrdered)
      ).to.be.revertedWith("Amount to redeem is greater than balance");
    });

    it("reverts if tokens[] is unorderred", async () => {
      const { avatar, module, designatedToken, tokensOrdered } =
        await setupTestWithTestAvatar();
      await avatar.setModule(module.address);
      await designatedToken.approve(module.address, DesignatedTokenBalance);
      await expect(
        module.exit(DesignatedTokenBalance, [...tokensOrdered].reverse())
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("reverts if tokens[] contains duplicates", async () => {
      const { avatar, module, designatedToken, tokenOne } =
        await setupTestWithTestAvatar();
      await avatar.setModule(module.address);
      await designatedToken.approve(module.address, DesignatedTokenBalance);
      await expect(
        module.exit(DesignatedTokenBalance, [
          tokenOne.address,
          tokenOne.address,
        ])
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("redeeming 20% of circulating supply returns 20% of the avatar's assets", async () => {
      const {
        avatar,
        module,
        tokenOne,
        tokenTwo,
        tokensOrdered,
        designatedToken,
      } = await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

      await designatedToken.approve(module.address, DesignatedTokenBalance);

      const previousAvatarETHBalance = parseInt(
        (await waffle.provider.getBalance(avatar.address))._hex
      );
      const previousAvatarTokenOneBalance = parseInt(
        (await tokenOne.balanceOf(avatar.address))._hex
      );
      const previousAvatarTokenTwoBalance = parseInt(
        (await tokenTwo.balanceOf(avatar.address))._hex
      );

      const previousUserETHBalance = BigNumber.from(
        await waffle.provider.getBalance(user.address)
      );
      const previousUserTokenOneBalance = parseInt(
        (await tokenOne.balanceOf(user.address))._hex
      );
      const previousUserTokenTwoBalance = parseInt(
        (await tokenTwo.balanceOf(user.address))._hex
      );

      await expect(await module.exit(DesignatedTokenBalance, tokensOrdered))
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(previousAvatarETHBalance * 0.8);

      expect(
        parseInt((await tokenOne.balanceOf(avatar.address))._hex)
      ).to.be.equal(previousAvatarTokenOneBalance * 0.8);

      expect(
        parseInt((await tokenTwo.balanceOf(avatar.address))._hex)
      ).to.be.equal(previousAvatarTokenTwoBalance * 0.8);

      // didn't calculate exactly because of gas costs
      expect(
        BigNumber.from(await waffle.provider.getBalance(user.address)).gt(
          previousUserETHBalance
        )
      );

      expect(
        parseInt((await tokenOne.balanceOf(user.address))._hex)
      ).to.be.equal(
        previousUserTokenOneBalance + previousAvatarTokenOneBalance * 0.2
      );

      expect(
        parseInt((await tokenTwo.balanceOf(user.address))._hex)
      ).to.be.equal(
        previousUserTokenTwoBalance + previousAvatarTokenTwoBalance * 0.2
      );
    });

    it("redeeming 10% of circulating supply returns 10% of the avatar's assets", async () => {
      const {
        avatar,
        module,
        tokenOne,
        tokenTwo,
        designatedToken,
        tokensOrdered,
      } = await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

      await designatedToken.approve(module.address, DesignatedTokenBalance);

      const previousAvatarETHBalance = parseInt(
        (await waffle.provider.getBalance(avatar.address))._hex
      );
      const previousAvatarTokenOneBalance = parseInt(
        (await tokenOne.balanceOf(avatar.address))._hex
      );
      const previousAvatarTokenTwoBalance = parseInt(
        (await tokenTwo.balanceOf(avatar.address))._hex
      );

      const previousUserETHBalance = BigNumber.from(
        await waffle.provider.getBalance(user.address)
      );
      const previousUserTokenOneBalance = parseInt(
        (await tokenOne.balanceOf(user.address))._hex
      );
      const previousUserTokenTwoBalance = parseInt(
        (await tokenTwo.balanceOf(user.address))._hex
      );

      await expect(
        await module.exit(DesignatedTokenBalance.div(2), tokensOrdered)
      )
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      expect(
        parseInt((await waffle.provider.getBalance(avatar.address))._hex)
      ).to.be.equal(previousAvatarETHBalance * 0.9);

      expect(
        parseInt((await tokenOne.balanceOf(avatar.address))._hex)
      ).to.be.equal(previousAvatarTokenOneBalance * 0.9);

      expect(
        parseInt((await tokenTwo.balanceOf(avatar.address))._hex)
      ).to.be.equal(previousAvatarTokenTwoBalance * 0.9);

      // didn't calculate exactly because of gas costs
      expect(
        BigNumber.from(await waffle.provider.getBalance(user.address)).gt(
          previousUserETHBalance
        )
      );

      expect(
        parseInt((await tokenOne.balanceOf(user.address))._hex)
      ).to.be.equal(
        previousUserTokenOneBalance + previousAvatarTokenOneBalance * 0.1
      );

      expect(
        parseInt((await tokenTwo.balanceOf(user.address))._hex)
      ).to.be.equal(
        previousUserTokenTwoBalance + previousAvatarTokenTwoBalance * 0.1
      );
    });

    it("throws because user haven't approve designated tokens", async () => {
      const { avatar, module, tokenOne, tokenTwo } =
        await setupTestWithTestAvatar();
      await avatar.setModule(module.address);

      await expect(
        module.exit(DesignatedTokenBalance, [
          tokenOne.address,
          tokenTwo.address,
        ])
      ).to.be.revertedWith("ERC20: transfer amount exceeds allowance");
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
      const { module, avatar, tokenOne } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        tokenOne.address,
      ]);
      await avatar.exec(module.address, 0, data);
      const newTokenAddress = await module.designatedToken();
      expect(newTokenAddress).to.be.equal(tokenOne.address);
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
