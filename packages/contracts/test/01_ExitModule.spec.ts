import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AbiCoder } from "ethers";
import hre from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const DesignatedTokenBalance = BigInt(10) ** BigInt(18) * BigInt(5); // Equal to 5
const TokenOneBalance = BigInt(10) ** BigInt(6) * BigInt(10); //  Equal to 100
const TokenTwoBalance = BigInt(10) ** BigInt(12) * BigInt(10); // Equal to 100

describe("ExitERC20", async () => {
  let initializeParams: string;

  async function setupToken() {
    const [user, anotherUser, , deployer] = await hre.ethers.getSigners();

    const Token = await hre.ethers.getContractFactory("TestToken", deployer);

    const designatedToken = await Token.deploy(18);
    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);

    const tokensOrdered = [
      await tokenOne.getAddress(),
      await tokenTwo.getAddress(),
    ].sort((a, b) => Number(a) - Number(b));
    await designatedToken.mint(user.address, DesignatedTokenBalance);
    return {
      user,
      anotherUser,
      deployer,
      tokenOne,
      tokenTwo,
      Token,
      designatedToken,
      tokensOrdered,
    };
  }

  async function baseSetup() {
    const base = await setupToken();

    const {
      user,
      anotherUser,
      deployer,
      tokenOne,
      tokenTwo,
      designatedToken,
      tokensOrdered,
    } = base;
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    designatedToken.mint(
      anotherUser.address,
      DesignatedTokenBalance * BigInt(4)
    );

    const avatarAddress = await avatar.getAddress();
    await user.sendTransaction({ to: avatarAddress, value: 100 });
    await tokenOne.mint(avatarAddress, TokenOneBalance);
    await tokenTwo.mint(avatarAddress, TokenTwoBalance);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC20",
      deployer
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      user.address,
      await designatedToken.getAddress(),
      [avatarAddress]
    );
    initializeParams = new AbiCoder().encode(
      ["address", "address", "address", "address", "address"],
      [
        avatarAddress,
        avatarAddress,
        avatarAddress,
        await designatedToken.getAddress(),
        await circulatingSupply.getAddress(),
      ]
    );

    return {
      ...base,
      Avatar,
      avatar,
      tokenOne,
      tokenTwo,
      circulatingSupply,
      designatedToken,
      tokensOrdered,
    };
  }

  async function setupTestWithTestAvatar() {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("ExitERC20");
    const module = await Module.deploy(
      await base.avatar.getAddress(),
      await base.avatar.getAddress(),
      await base.avatar.getAddress(),
      await base.designatedToken.getAddress(),
      await base.circulatingSupply.getAddress()
    );

    return { ...base, Module, module };
  }

  describe("setUp() ", () => {
    it("reverts if module has already been initialized", async () => {
      const { user, designatedToken, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC20");
      const module = await Module.deploy(
        user.address,
        user.address,
        user.address,
        await designatedToken.getAddress(),
        await circulatingSupply.getAddress()
      );
      await expect(module.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("reverts if avatar is zero address", async () => {
      const { user, designatedToken, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC20");
      await expect(
        Module.deploy(
          user.address,
          AddressZero,
          user.address,
          await designatedToken.getAddress(),
          await circulatingSupply.getAddress()
        )
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("reverts if target is zero address", async () => {
      const { user, designatedToken, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC20");
      await expect(
        Module.deploy(
          user.address,
          user.address,
          AddressZero,
          await designatedToken.getAddress(),
          circulatingSupply.getAddress()
        )
      ).to.be.revertedWith("Target can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const { user, deployer, designatedToken, avatar, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC20", deployer);
      const module = await Module.deploy(
        await avatar.getAddress(),
        await avatar.getAddress(),
        await avatar.getAddress(),
        await designatedToken.getAddress(),
        await circulatingSupply.getAddress()
      );

      await expect(module.deploymentTransaction())
        .to.emit(module, "ExitModuleSetup")
        .withArgs(deployer.address, await avatar.getAddress());
    });
  });

  describe("addToDenyList()", () => {
    it("should add address to denied list", async () => {
      const { module, avatar, tokenOne } = await loadFixture(
        setupTestWithTestAvatar
      );
      const data = module.interface.encodeFunctionData("addToDenyList", [
        [await tokenOne.getAddress()],
      ]);
      await avatar.exec(await module.getAddress(), 0, data);
      const moduleIsAdded = await module.deniedTokens(tokenOne.getAddress());
      expect(moduleIsAdded).to.be.true;
    });
    it("reverts if not authorized", async () => {
      const { module, tokenTwo } = await loadFixture(setupTestWithTestAvatar);
      await expect(
        module.addToDenyList([await tokenTwo.getAddress()])
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });

    it("reverts if token is already in list", async () => {
      const { module, avatar, tokenTwo } = await loadFixture(
        setupTestWithTestAvatar
      );
      const data = module.interface.encodeFunctionData("addToDenyList", [
        [await tokenTwo.getAddress()],
      ]);
      await avatar.exec(await module.getAddress(), 0, data);

      await expect(
        avatar.exec(await module.getAddress(), 0, data)
      ).to.be.revertedWith(`Token already denied`);
    });
  });

  describe("removeFromDenyList()", () => {
    it("should remove address from denied list", async () => {
      const { module, avatar, tokenOne } = await loadFixture(
        setupTestWithTestAvatar
      );
      const addTokenData = module.interface.encodeFunctionData(
        "addToDenyList",
        [[await tokenOne.getAddress()]]
      );
      await avatar.exec(await module.getAddress(), 0, addTokenData);
      const moduleIsAdded = await module.deniedTokens(
        await tokenOne.getAddress()
      );
      expect(moduleIsAdded).to.be.true;
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenyList",
        [[await tokenOne.getAddress()]]
      );

      await avatar.exec(await module.getAddress(), 0, removeTokenData);
      const moduleIsNotAdded = await module.deniedTokens(
        await tokenOne.getAddress()
      );
      expect(moduleIsNotAdded).to.be.false;
    });

    it("reverts if token is not added in list", async () => {
      const { module, avatar, tokenTwo } = await loadFixture(
        setupTestWithTestAvatar
      );
      const removeTokenData = module.interface.encodeFunctionData(
        "removeFromDenyList",
        [[await tokenTwo.getAddress()]]
      );
      await expect(
        avatar.exec(await module.getAddress(), 0, removeTokenData)
      ).to.be.revertedWith(`Token not denied`);
    });

    it("reverts if not authorized", async () => {
      const { module, tokenOne } = await loadFixture(setupTestWithTestAvatar);
      await expect(
        module.removeFromDenyList([await tokenOne.getAddress()])
      ).to.be.revertedWith(`Ownable: caller is not the owner`);
    });
  });

  describe("exit()", () => {
    it("reverts if token is added in denied tokens list", async () => {
      const { avatar, module, tokenOne, tokenTwo, designatedToken } =
        await loadFixture(setupTestWithTestAvatar);
      const data = module.interface.encodeFunctionData("addToDenyList", [
        [await tokenOne.getAddress()],
      ]);
      await avatar.exec(await module.getAddress(), 0, data);

      await avatar.setModule(await module.getAddress());
      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );

      await expect(
        module.exit(DesignatedTokenBalance, [
          await tokenOne.getAddress(),
          await tokenTwo.getAddress(),
        ])
      ).to.be.revertedWith(`Denied token`);
    });

    it("reverts if designated token is in list", async () => {
      const { avatar, module, tokenOne, designatedToken } = await loadFixture(
        setupTestWithTestAvatar
      );
      const data = module.interface.encodeFunctionData("addToDenyList", [
        [await tokenOne.getAddress()],
      ]);
      await avatar.exec(await module.getAddress(), 0, data);

      await avatar.setModule(await module.getAddress());
      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );

      await expect(
        module.exit(DesignatedTokenBalance, [
          await designatedToken.getAddress(),
        ])
      ).to.be.revertedWith("Designated token can't be redeemed");
    });

    it("reverts because user is trying to redeem more tokens than he owns", async () => {
      const { avatar, module, tokensOrdered } = await loadFixture(
        setupTestWithTestAvatar
      );
      await avatar.setModule(await module.getAddress());
      await expect(
        module.exit(DesignatedTokenBalance * 2n, tokensOrdered)
      ).to.be.revertedWith("Amount to redeem is greater than balance");
    });

    it("reverts if tokens[] is unorderred", async () => {
      const { avatar, module, designatedToken, tokensOrdered } =
        await loadFixture(setupTestWithTestAvatar);
      await avatar.setModule(await module.getAddress());
      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );
      await expect(
        module.exit(DesignatedTokenBalance, [...tokensOrdered].reverse())
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("reverts if tokens[] contains duplicates", async () => {
      const { avatar, module, designatedToken, tokenOne } = await loadFixture(
        setupTestWithTestAvatar
      );
      await avatar.setModule(await module.getAddress());
      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );
      await expect(
        module.exit(DesignatedTokenBalance, [
          await tokenOne.getAddress(),
          await tokenOne.getAddress(),
        ])
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("redeeming 20% of circulating supply returns 20% of the avatar's assets", async () => {
      const {
        user,
        avatar,
        module,
        tokenOne,
        tokenTwo,
        tokensOrdered,
        designatedToken,
      } = await loadFixture(setupTestWithTestAvatar);
      await avatar.setModule(await module.getAddress());

      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );

      const previousAvatarETHBalance = await hre.ethers.provider.getBalance(
        await avatar.getAddress()
      );

      const previousAvatarTokenOneBalance = await tokenOne.balanceOf(
        await avatar.getAddress()
      );

      const previousAvatarTokenTwoBalance = await tokenTwo.balanceOf(
        await avatar.getAddress()
      );

      const previousUserETHBalance = await hre.ethers.provider.getBalance(
        user.address
      );

      const previousUserTokenOneBalance = await tokenOne.balanceOf(
        user.address
      );

      const previousUserTokenTwoBalance = await tokenTwo.balanceOf(
        user.address
      );

      await expect(await module.exit(DesignatedTokenBalance, tokensOrdered))
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      expect(
        await hre.ethers.provider.getBalance(await avatar.getAddress())
      ).to.be.equal((previousAvatarETHBalance * 80n) / 100n);

      expect(await tokenOne.balanceOf(await avatar.getAddress())).to.be.equal(
        (previousAvatarTokenOneBalance * 80n) / 100n
      );

      expect(await tokenTwo.balanceOf(await avatar.getAddress())).to.be.equal(
        (previousAvatarTokenTwoBalance * 80n) / 100n
      );

      expect(await tokenOne.balanceOf(user.address)).to.equal(
        previousUserTokenOneBalance +
          (previousAvatarTokenOneBalance * 20n) / 100n
      );

      expect(await tokenTwo.balanceOf(user.address)).to.be.equal(
        previousUserTokenTwoBalance +
          (previousAvatarTokenTwoBalance * 20n) / 100n
      );
    });

    it("redeeming 10% of circulating supply returns 10% of the avatar's assets", async () => {
      const {
        user,
        avatar,
        module,
        tokenOne,
        tokenTwo,
        designatedToken,
        tokensOrdered,
      } = await setupTestWithTestAvatar();
      await avatar.setModule(await module.getAddress());

      await designatedToken.approve(
        await module.getAddress(),
        DesignatedTokenBalance
      );

      const previousAvatarETHBalance = await hre.ethers.provider.getBalance(
        await avatar.getAddress()
      );

      const previousAvatarTokenOneBalance = await tokenOne.balanceOf(
        await avatar.getAddress()
      );

      const previousAvatarTokenTwoBalance = await tokenTwo.balanceOf(
        await avatar.getAddress()
      );

      const previousUserETHBalance = await hre.ethers.provider.getBalance(
        user.address
      );

      const previousUserTokenOneBalance = await tokenOne.balanceOf(
        user.address
      );

      const previousUserTokenTwoBalance = await tokenTwo.balanceOf(
        user.address
      );

      await expect(
        await module.exit(DesignatedTokenBalance / 2n, tokensOrdered)
      )
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      expect(
        await hre.ethers.provider.getBalance(await avatar.getAddress())
      ).to.be.equal((previousAvatarETHBalance * 90n) / 100n);

      expect(await tokenOne.balanceOf(await avatar.getAddress())).to.be.equal(
        (previousAvatarTokenOneBalance * 90n) / 100n
      );

      expect(await tokenTwo.balanceOf(await avatar.getAddress())).to.be.equal(
        (previousAvatarTokenTwoBalance * 90n) / 100n
      );

      expect(await tokenOne.balanceOf(user.address)).to.be.equal(
        previousUserTokenOneBalance +
          (previousAvatarTokenOneBalance * 10n) / 100n
      );

      expect(await tokenTwo.balanceOf(user.address)).to.be.equal(
        previousUserTokenTwoBalance +
          (previousAvatarTokenTwoBalance * 10n) / 100n
      );
    });

    it("reverts if user hasn't approved designated tokens", async () => {
      const { avatar, module, tokenOne, tokenTwo } =
        await setupTestWithTestAvatar();
      await avatar.setModule(await module.getAddress());

      await expect(
        module.exit(DesignatedTokenBalance, [
          await tokenOne.getAddress(),
          await tokenTwo.getAddress(),
        ])
      ).to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
    });
  });

  describe("getCirculatingSupply", () => {
    it("should return circulating supply ", async () => {
      const { module } = await setupTestWithTestAvatar();
      const circulatingSupply = await module.getCirculatingSupply();
      expect(circulatingSupply).to.be.equal(25000000000000000000n);
    });
  });

  describe("setDesignedToken()", () => {
    it("should set designated token", async () => {
      const { module, avatar, tokenOne } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("setDesignatedToken", [
        await tokenOne.getAddress(),
      ]);
      await avatar.exec(await module.getAddress(), 0, data);
      const newTokenAddress = await module.designatedToken();
      expect(newTokenAddress).to.be.equal(await tokenOne.getAddress());
    });

    it("reverts if avatar is msg.sender is not the avatar", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setDesignatedToken(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("setCirculatingSupply()", () => {
    it("reverts if avatar is msg.sender is not the owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setCirculatingSupply(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should set designated token", async () => {
      const { module, avatar, circulatingSupply } =
        await setupTestWithTestAvatar();

      const address = await circulatingSupply.getAddress();
      const data = module.interface.encodeFunctionData("setCirculatingSupply", [
        address,
      ]);
      await avatar.exec(await module.getAddress(), 0, data);

      expect(await module.circulatingSupply()).to.be.equal(address);
    });
  });

  describe("setAvatar", () => {
    it("should update avatar", async () => {
      const { user, module, avatar } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("setAvatar", [
        await user.getAddress(),
      ]);

      const oldAvatar = await module.avatar();
      expect(oldAvatar).to.be.equal(await avatar.getAddress());

      await avatar.exec(await module.getAddress(), 0, data);

      const newAvatar = await module.avatar();
      expect(newAvatar).to.be.equal(user.address);
    });
    it("reverts because its not being called by owner", async () => {
      const { user, module } = await setupTestWithTestAvatar();
      await expect(
        module.setAvatar(await user.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("transferOwnership", () => {
    it("should transfer ownership", async () => {
      const { user, module, avatar } = await setupTestWithTestAvatar();
      const data = module.interface.encodeFunctionData("transferOwnership", [
        user.address,
      ]);

      const oldOwner = await module.owner();
      expect(oldOwner).to.be.equal(await avatar.getAddress());

      await avatar.exec(await module.getAddress(), 0, data);

      const newOwner = await module.owner();
      expect(newOwner).to.be.equal(user.address);
    });

    it("reverts because its not being called by owner", async () => {
      const { user, module } = await setupTestWithTestAvatar();
      await expect(
        module.transferOwnership(await user.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
