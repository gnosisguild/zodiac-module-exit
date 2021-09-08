import { expect } from "chai";
import hre, { deployments, waffle, ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { AddressZero } from "@ethersproject/constants";
import { AbiCoder } from "ethers/lib/utils";

describe("CirculatingSupply", async () => {
  const [user1, user2] = waffle.provider.getWallets();
  const SENTINEL_EXCLUSIONS = "0x0000000000000000000000000000000000000001";
  const FirstAddress = "0x0000000000000000000000000000000000000001";
  const saltNonce = "0xfa";

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const Token = await hre.ethers.getContractFactory("TestToken");
    const designatedToken = await Token.deploy(18);
    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupply"
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      user1.address,
      designatedToken.address,
      [avatar.address]
    );
    await user1.sendTransaction({ to: avatar.address, value: 100 });
    await designatedToken.mint(avatar.address, 100);
    await designatedToken.mint(user1.address, 100);
    await designatedToken.mint(user2.address, 100);

    const initializeParams = new AbiCoder().encode(
      ["address", "address", "address[]"],
      [user1.address, designatedToken.address, [user1.address, avatar.address]]
    );

    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();

    return {
      avatar,
      designatedToken,
      tokenOne,
      tokenTwo,
      CirculatingSupply,
      circulatingSupply,
      initializeParams,
      factory,
    };
  });

  describe("constructor", async () => {
    it("sets owner", async () => {
      const { avatar, designatedToken, CirculatingSupply } = await setupTests();
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        designatedToken.address,
        [avatar.address]
      );
      expect(await circulatingSupply.owner()).to.be.equals(user1.address);
    });

    it("sets token to designatedToken", async () => {
      const { avatar, designatedToken, CirculatingSupply } = await setupTests();
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        designatedToken.address,
        [avatar.address]
      );
      expect(await circulatingSupply.token()).to.be.equals(
        designatedToken.address
      );
    });

    it("adds one exclusion", async () => {
      const { avatar, designatedToken, CirculatingSupply } = await setupTests();
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        designatedToken.address,
        [avatar.address]
      );
      const exclusions = [
        avatar.address,
        "0x0000000000000000000000000000000000000000",
      ];
      expect(
        (
          await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString()
      ).to.be.equals(exclusions.toString());
    });

    it("adds multiple exclusions", async () => {
      const { avatar, designatedToken, CirculatingSupply } = await setupTests();
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        designatedToken.address,
        [avatar.address, user1.address]
      );
      const exclusions = [
        user1.address,
        avatar.address,
        "0x0000000000000000000000000000000000000000",
      ];
      expect(
        (
          await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString()
      ).to.be.equals(exclusions.toString());
    });
  });

  describe("setup()", async () => {
    it("should throw because master copy is already initialized", async () => {
      const { avatar, circulatingSupply, designatedToken, initializeParams } =
        await setupTests();

      expect(circulatingSupply.setUp(initializeParams)).to.be.revertedWith(
        "Contract is already initialized"
      );
    });

    it("sets owner", async () => {
      const { circulatingSupply, initializeParams, factory } =
        await setupTests();

      const proxy = await factory.deployModule(
        circulatingSupply.address,
        initializeParams,
        saltNonce
      );
      expect(await proxy.owner()).to.be.equals(user1.address);
    });
  });
});
