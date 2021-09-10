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
    expect(user1.sendTransaction({ to: avatar.address, value: 100 }));
    expect(designatedToken.mint(avatar.address, 100));
    expect(designatedToken.mint(user1.address, 100));
    expect(designatedToken.mint(user2.address, 100));

    const initializeParams = new AbiCoder().encode(
      ["address", "address", "address[]"],
      [user1.address, designatedToken.address, [user1.address, avatar.address]]
    );

    const setupEncodeParams = circulatingSupply.interface.encodeFunctionData(
      "setUp",
      [initializeParams]
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
      setupEncodeParams,
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
      const exclusions = [avatar.address, SENTINEL_EXCLUSIONS];
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
      const exclusions = [user1.address, avatar.address, SENTINEL_EXCLUSIONS];
      expect(
        (
          await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString()
      ).to.be.equals(exclusions.toString());
    });
  });

  describe("setup()", async () => {
    it("throws on mastercopy because already initialized", async () => {
      const { avatar, circulatingSupply, designatedToken, initializeParams } =
        await setupTests();

      expect(circulatingSupply.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("sets owner", async () => {
      const {
        circulatingSupply,
        initializeParams,
        factory,
        setupEncodeParams,
      } = await setupTests();

      const receipt = await factory
        .deployModule(circulatingSupply.address, setupEncodeParams, saltNonce)
        .then((tx: any) => tx.wait());

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(
        ({ event }: { event: string }) => event === "ModuleProxyCreation"
      );

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupply",
        newProxyAddress
      );
      expect(await newProxy.owner()).to.be.eq(user1.address);
    });

    it("sets token to designatedToken", async () => {
      const {
        circulatingSupply,
        initializeParams,
        factory,
        setupEncodeParams,
        designatedToken,
      } = await setupTests();

      const receipt = await factory
        .deployModule(circulatingSupply.address, setupEncodeParams, saltNonce)
        .then((tx: any) => tx.wait());

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(
        ({ event }: { event: string }) => event === "ModuleProxyCreation"
      );

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupply",
        newProxyAddress
      );
      expect(await newProxy.token()).to.be.eq(designatedToken.address);
    });

    it("adds multiple exclusions", async () => {
      const {
        avatar,
        circulatingSupply,
        initializeParams,
        factory,
        setupEncodeParams,
      } = await setupTests();

      const receipt = await factory
        .deployModule(circulatingSupply.address, setupEncodeParams, saltNonce)
        .then((tx: any) => tx.wait());

      // retrieve new address from event
      const {
        args: [newProxyAddress],
      } = receipt.events.find(
        ({ event }: { event: string }) => event === "ModuleProxyCreation"
      );

      const newProxy = await hre.ethers.getContractAt(
        "CirculatingSupply",
        newProxyAddress
      );
      const exclusions = [avatar.address, user1.address, SENTINEL_EXCLUSIONS];
      expect(
        (
          await newProxy.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3)
        ).toString()
      ).to.be.equals(exclusions.toString());
    });
  });

  describe("get()", async () => {
    it("returns circulating supply", async () => {
      const { circulatingSupply } = await setupTests();
      expect(await circulatingSupply.get()).to.be.equals(200);
    });

    it("returns circulating supply with multiple exclusions", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      expect(await circulatingSupply.get()).to.be.equals(100);
    });
  });

  describe("setToken()", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply, tokenTwo } = await setupTests();
      expect(
        circulatingSupply.connect(user2).setToken(tokenTwo.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows owner to set token", async () => {
      const { circulatingSupply, tokenOne } = await setupTests();
      expect(circulatingSupply.setToken(tokenOne.address));
    });

    it("emits new token", async () => {
      const { circulatingSupply, tokenOne } = await setupTests();
      expect(circulatingSupply.setToken(tokenOne.address))
        .to.emit(circulatingSupply, "TokenSet")
        .withArgs(tokenOne.address);
    });
  });

  describe("exclude", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply } = await setupTests();
      expect(
        circulatingSupply.connect(user2).exclude(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is zero address", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(AddressZero)).to.be.revertedWith(
        "Invalid exclusion"
      );
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(SENTINEL_EXCLUSIONS)).to.be.revertedWith(
        "Invalid exclusion"
      );
    });

    it("reverts if exclusion is already enabled", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      expect(circulatingSupply.exclude(user1.address)).to.be.revertedWith(
        "Exclusion already enabled"
      );
    });

    it("enables a exclusion", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
    });
  });

  describe("removeExclusion", async () => {
    it("reverts if caller is not the owner", async () => {
      const { circulatingSupply } = await setupTests();
      expect(
        circulatingSupply
          .connect(user2)
          .removeExclusion(SENTINEL_EXCLUSIONS, user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is zero address", async () => {
      const { circulatingSupply } = await setupTests();
      expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, AddressZero)
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { circulatingSupply } = await setupTests();
      expect(
        circulatingSupply.removeExclusion(
          SENTINEL_EXCLUSIONS,
          SENTINEL_EXCLUSIONS
        )
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already disabled", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
      expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      ).to.be.revertedWith("Exclusion already disabled");
    });

    it("disables a exclusion", async () => {
      const { circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
    });
  });

  describe("isExcluded", async () => {
    it("returns false if SENTINEL_EXCLUSIONS is provided", async () => {
      const { circulatingSupply } = await setupTests();
      expect(
        await circulatingSupply.isExcluded(SENTINEL_EXCLUSIONS)
      ).to.be.equals(false);
    });

    it("returns false if AddressZero is provided", async () => {
      const { circulatingSupply } = await setupTests();
      expect(await circulatingSupply.isExcluded(AddressZero)).to.be.equals(
        false
      );
    });

    it("returns false if exclusion is not enabled", async () => {
      const { circulatingSupply } = await setupTests();
      expect(await circulatingSupply.isExcluded(user1.address)).to.be.equals(
        false
      );
    });

    it("returns true if exclusion is enabled", async () => {
      const { circulatingSupply } = await setupTests();
      // delete once you figure out why you need to do this twice
      expect(await circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);

      expect(await circulatingSupply.exclude(user2.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      expect(await circulatingSupply.isExcluded(user2.address)).to.be.equals(
        true
      );
    });
  });

  describe("getExclusionsPaginated", async () => {
    it("returns empty array if no exclusions are enabled.", async () => {
      const { CirculatingSupply, designatedToken } = await setupTests();
      const circulatingSupply = await CirculatingSupply.deploy(
        user1.address,
        designatedToken.address,
        []
      );
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals([[], SENTINEL_EXCLUSIONS].toString());
    });

    it("returns one exclusion if one exclusion is enabled", async () => {
      const { avatar, circulatingSupply } = await setupTests();
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals(
        [[avatar.address], SENTINEL_EXCLUSIONS].toString()
      );
    });

    it("returns two exclusions if two exclusions are enabled", async () => {
      const { avatar, circulatingSupply } = await setupTests();
      expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals(
        [user1.address, avatar.address, SENTINEL_EXCLUSIONS].toString()
      );
    });
  });
});
