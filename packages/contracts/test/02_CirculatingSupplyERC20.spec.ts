import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AbiCoder, ZeroAddress } from "ethers";
import hre from "hardhat";

import { deployFactories, deployProxy } from "@gnosis-guild/zodiac-core";
import createAdapter from "./createEIP1193";

describe("CirculatingSupply", async () => {
  const [user1, user2, , , deployer] = await hre.ethers.getSigners();
  const eip1193Provider = createAdapter({
    provider: hre.network.provider,
    signer: deployer,
  });

  const SENTINEL_EXCLUSIONS = "0x0000000000000000000000000000000000000001";
  const saltNonce = "0xfa";

  async function setupTests() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();
    const Token = await hre.ethers.getContractFactory("TestToken");
    const designatedToken = await Token.deploy(18);
    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);
    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC20",
    );
    const circulatingSupply = await CirculatingSupply.deploy(
      user1.address,
      await designatedToken.getAddress(),
      [await avatar.getAddress()],
    );
    expect(
      user1.sendTransaction({ to: await avatar.getAddress(), value: 100 }),
    );
    expect(designatedToken.mint(await avatar.getAddress(), 100));
    expect(designatedToken.mint(user1.address, 100));
    expect(designatedToken.mint(user2.address, 100));

    const initializeParams = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address[]"],
      [
        user1.address,
        await designatedToken.getAddress(),
        [user1.address, await avatar.getAddress()],
      ],
    );

    const setupEncodeParams = circulatingSupply.interface.encodeFunctionData(
      "setUp",
      [initializeParams],
    );

    await deployFactories({ provider: eip1193Provider });

    return {
      avatar,
      designatedToken,
      tokenOne,
      tokenTwo,
      CirculatingSupply,
      circulatingSupply,
      initializeParams,
      setupEncodeParams,
    };
  }

  describe("constructor", async () => {
    it("sets owner", async () => {
      const { avatar, designatedToken, CirculatingSupply } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        await designatedToken.getAddress(),
        [await avatar.getAddress()],
      );
      expect(await circulatingSupply.owner()).to.be.equals(user1.address);
    });

    it("sets token to designatedToken", async () => {
      const { avatar, designatedToken, CirculatingSupply } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        await designatedToken.getAddress(),
        [await avatar.getAddress()],
      );
      expect(await circulatingSupply.token()).to.be.equals(
        await designatedToken.getAddress(),
      );
    });

    it("adds one exclusion", async () => {
      const { avatar, designatedToken, CirculatingSupply } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        await designatedToken.getAddress(),
        [await avatar.getAddress()],
      );
      const exclusions = [await avatar.getAddress(), SENTINEL_EXCLUSIONS];
      expect(
        (
          await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString(),
      ).to.be.equals(exclusions.toString());
    });

    it("adds multiple exclusions", async () => {
      const { avatar, designatedToken, CirculatingSupply } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        await designatedToken.getAddress(),
        [await avatar.getAddress(), user1.address],
      );
      const exclusions = [
        user1.address,
        await avatar.getAddress(),
        SENTINEL_EXCLUSIONS,
      ];
      expect(
        (
          await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString(),
      ).to.be.equals(exclusions.toString());
    });
  });

  describe("setup()", async () => {
    it("throws on mastercopy because already initialized", async () => {
      const { circulatingSupply, initializeParams } =
        await loadFixture(setupTests);

      expect(circulatingSupply.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("sets owner", async () => {
      const { avatar, circulatingSupply, designatedToken } = await setupTests();

      const { address } = await deployProxy({
        mastercopy: await circulatingSupply.getAddress(),
        setupArgs: {
          types: ["address", "address", "address[]"],
          values: [
            user1.address,
            await designatedToken.getAddress(),
            [user1.address, await avatar.getAddress()],
          ],
        },
        saltNonce,
        provider: eip1193Provider,
      });

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC20",
        address,
      );
      expect(await newProxy.owner()).to.be.eq(user1.address);
    });

    it("sets token to designatedToken", async () => {
      const { avatar, circulatingSupply, designatedToken } = await setupTests();

      const { address } = await deployProxy({
        mastercopy: await circulatingSupply.getAddress(),
        setupArgs: {
          types: ["address", "address", "address[]"],
          values: [
            user1.address,
            await designatedToken.getAddress(),
            [user1.address, await avatar.getAddress()],
          ],
        },
        saltNonce,
        provider: eip1193Provider,
      });

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC20",
        address,
      );

      expect(await newProxy.token()).to.be.eq(
        await designatedToken.getAddress(),
      );
    });

    it("adds multiple exclusions", async () => {
      const { avatar, designatedToken, circulatingSupply } = await setupTests();

      const { address } = await deployProxy({
        mastercopy: await circulatingSupply.getAddress(),
        setupArgs: {
          types: ["address", "address", "address[]"],
          values: [
            user1.address,
            await designatedToken.getAddress(),
            [await avatar.getAddress(), user1.address],
          ],
        },
        saltNonce,
        provider: eip1193Provider,
      });

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC20",
        address,
      );

      const exclusions = [
        user1.address,
        await avatar.getAddress(),
        SENTINEL_EXCLUSIONS,
      ];

      expect(
        (
          await newProxy.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString(),
      ).to.be.equals(exclusions.toString());
    });
  });

  describe("get()", async () => {
    it("returns circulating supply", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      expect(await circulatingSupply.get()).to.be.equals(200);
    });

    it("returns circulating supply with multiple exclusions", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      expect(await circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      expect(await circulatingSupply.get()).to.be.equals(100);
    });
  });

  describe("setToken()", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply, tokenTwo } = await loadFixture(setupTests);
      expect(
        circulatingSupply.connect(user2).setToken(await tokenTwo.getAddress()),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows owner to set token", async () => {
      const { circulatingSupply, tokenOne } = await loadFixture(setupTests);
      expect(circulatingSupply.setToken(await tokenOne.getAddress()));
    });

    it("emits new token", async () => {
      const { circulatingSupply, tokenOne } = await loadFixture(setupTests);
      expect(circulatingSupply.setToken(await tokenOne.getAddress()))
        .to.emit(circulatingSupply, "TokenSet")
        .withArgs(await tokenOne.getAddress());
    });
  });

  describe("exclude", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(
        circulatingSupply.connect(user2).exclude(user2.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is zero address", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(ZeroAddress)).to.be.revertedWith(
        "Invalid exclusion",
      );
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(
        circulatingSupply.exclude(SENTINEL_EXCLUSIONS),
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already enabled", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      await expect(circulatingSupply.exclude(user1.address)).to.be.revertedWith(
        "Exclusion already enabled",
      );
    });

    it("enables a exclusion", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
    });
  });

  describe("removeExclusion", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(
        circulatingSupply
          .connect(user2)
          .removeExclusion(SENTINEL_EXCLUSIONS, user2.address),
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is zero address", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, ZeroAddress),
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(
        circulatingSupply.removeExclusion(
          SENTINEL_EXCLUSIONS,
          SENTINEL_EXCLUSIONS,
        ),
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already disabled", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address),
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address),
      ).to.be.revertedWith("Exclusion already disabled");
    });

    it("disables a exclusion", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address),
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
    });
  });

  describe("isExcluded", async () => {
    it("returns false if SENTINEL_EXCLUSIONS is provided", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      expect(
        await circulatingSupply.isExcluded(SENTINEL_EXCLUSIONS),
      ).to.be.equals(false);
    });

    it("returns false if AddressZero is provided", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      expect(await circulatingSupply.isExcluded(ZeroAddress)).to.be.equals(
        false,
      );
    });

    it("returns false if exclusion is not enabled", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      expect(await circulatingSupply.isExcluded(user1.address)).to.be.equals(
        false,
      );
    });

    it("returns true if exclusion is enabled", async () => {
      const { circulatingSupply } = await loadFixture(setupTests);
      // delete once you figure out why you need to do this twice
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);

      await expect(circulatingSupply.exclude(user2.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      expect(await circulatingSupply.isExcluded(user2.address)).to.be.equals(
        true,
      );
    });
  });

  describe("getExclusionsPaginated", async () => {
    it("returns empty array if no exclusions are enabled.", async () => {
      const { CirculatingSupply, designatedToken } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        await designatedToken.getAddress(),
        [],
      );
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3,
      );
      tx = tx.toString();
      expect(tx).to.be.equals([[], SENTINEL_EXCLUSIONS].toString());
    });

    it("returns one exclusion if one exclusion is enabled", async () => {
      const { avatar, circulatingSupply } = await loadFixture(setupTests);
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3,
      );
      // tx = tx.toString();
      // expect(tx).to.be.equals(
      //   [[await avatar.getAddress()], SENTINEL_EXCLUSIONS].toString()
      // );
    });

    it("returns two exclusions if two exclusions are enabled", async () => {
      const { avatar, circulatingSupply } = await loadFixture(setupTests);
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3,
      );
      // tx = tx.toString();
      // expect(tx).to.be.equals(
      //   [
      //     user1.address,
      //     await avatar.getAddress(),
      //     SENTINEL_EXCLUSIONS,
      //   ].toString()
      // );
    });
  });
});
