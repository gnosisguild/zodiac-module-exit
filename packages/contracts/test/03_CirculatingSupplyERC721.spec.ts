import { expect } from "chai";
import "@nomiclabs/hardhat-ethers";
import { BigNumber, ContractFactory, ethers } from "ethers";
import hre, { deployments, waffle } from "hardhat";

describe("CirculatingSupplyERC721", async () => {
  const [user1, user2, user3] = waffle.provider.getWallets();
  const SENTINEL_EXCLUSIONS = "0x0000000000000000000000000000000000000001";
  const saltNonce = "0xfa";

  const setupTests = deployments.createFixture(async ({ deployments }) => {
    await deployments.fixture();
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const Collection = await hre.ethers.getContractFactory("TestCollection");
    const avatar = await Avatar.deploy();
    const collection = await Collection.deploy();
    const collection2 = await Collection.deploy();
    const CirculatingSupplyERC721 = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC721"
    );

    // Mint 5 tokens
    await Promise.all([
      collection.mint(user1.address, 0),
      collection.mint(user1.address, 1),
      collection.mint(user2.address, 2),
      collection.mint(user2.address, 3),
      collection.mint(user3.address, 4),
    ]);

    // Mint 3 tokens
    await Promise.all([
      collection2.mint(user1.address, 0),
      collection2.mint(user2.address, 1),
      collection2.mint(user3.address, 2),
    ]);

    expect(user1.sendTransaction({ to: avatar.address, value: 100 }));

    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();

    return {
      avatar,
      collection,
      collection2,
      CirculatingSupplyERC721,
      factory,
    };
  });

  const setupProxyTest = async (
    { CirculatingSupplyERC721 }: { CirculatingSupplyERC721: ContractFactory },
    params: any
  ) => {
    const circulatingSupply = await CirculatingSupplyERC721.deploy(...params);

    const initializeParams = ethers.utils.defaultAbiCoder.encode(
      ["address", "address", "uint256[]"],
      params
    );

    const setupEncodeParams = circulatingSupply.interface.encodeFunctionData(
      "setUp",
      [initializeParams]
    );

    return {
      circulatingSupply,
      initializeParams,
      setupEncodeParams,
    };
  };

  const formatNumberArray = (numbers: BigNumber[]) => {
    return numbers.map((number) => number.toString());
  };
  const getProxyModuleCreationEvent = ({ event }: any) => {
    return event === "ModuleProxyCreation";
  };

  describe("constructor", async () => {
    it("sets owner", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [user1.address]
      );
      expect(await circulatingSupply.owner()).to.be.equals(user1.address);
    });

    it("sets token to collection", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [user1.address]
      );
      expect(await circulatingSupply.token()).to.be.equals(collection.address);
    });

    it("adds one exclusion", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [user1.address]
      );
      const [exclusions, next]: [BigNumber[], BigNumber] =
        await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 10);
      expect(formatNumberArray(exclusions)).to.be.eql([user1.address]);
      expect(next).to.be.equals(SENTINEL_EXCLUSIONS);
    });

    it("adds multiple exclusions", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        []
      );
      await circulatingSupply.exclude(user1.address);
      await circulatingSupply.exclude(user2.address);

      const [exclusions, next]: [BigNumber[], BigNumber] =
        await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 10);

      expect(formatNumberArray(exclusions)).to.be.eql([
        user2.address,
        user1.address,
      ]);
      expect(next).to.be.equals(SENTINEL_EXCLUSIONS);
    });
  });

  describe("setup()", async () => {
    it("throws if the circulating supply contract is already initialized", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();

      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply, initializeParams } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      await expect(
        circulatingSupply.setUp(initializeParams)
      ).to.be.revertedWith("Initializable: contract is already initialized");
    });

    it("sets owner", async () => {
      const { factory, collection, CirculatingSupplyERC721 } =
        await setupTests();

      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply, setupEncodeParams } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      const tx = await factory.deployModule(
        circulatingSupply.address,
        setupEncodeParams,
        saltNonce
      );
      const receipt = await tx.wait();

      // retrieve new address from event
      const event = receipt.events.find(getProxyModuleCreationEvent);
      const [proxyAddress] = event.args;

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        proxyAddress
      );
      expect(await proxy.owner()).to.be.eq(user1.address);
    });

    it("sets token to collection", async () => {
      const { factory, collection, CirculatingSupplyERC721 } =
        await setupTests();

      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply, setupEncodeParams } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      const tx = await factory.deployModule(
        circulatingSupply.address,
        setupEncodeParams,
        saltNonce
      );
      const receipt = await tx.wait();

      // retrieve new address from event
      const [proxyAddress] = receipt.events.find(
        getProxyModuleCreationEvent
      ).args;

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        proxyAddress
      );
      expect(await proxy.token()).to.be.eq(collection.address);
    });

    it("adds multiple exclusions", async () => {
      const { factory, collection, CirculatingSupplyERC721 } =
        await setupTests();

      const params = [
        user1.address,
        collection.address,
        [user1.address, user2.address],
      ];
      const { circulatingSupply, setupEncodeParams } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      const tx = await factory.deployModule(
        circulatingSupply.address,
        setupEncodeParams,
        saltNonce
      );
      const receipt = await tx.wait();

      // retrieve new address from event
      const [proxyAddress] = receipt.events.find(
        getProxyModuleCreationEvent
      ).args;

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        proxyAddress
      );
      const [exclusions] = await proxy.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        5
      );
      expect(formatNumberArray(exclusions)).to.be.eql([
        user2.address,
        user1.address,
      ]);
    });
  });

  describe("get()", async () => {
    it("returns circulating supply", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(await circulatingSupply.get()).to.be.equals(5);
    });

    it("returns circulating supply with multiple exclusions", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const params = [
        user1.address,
        collection.address,
        [user1.address, user2.address],
      ];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      // Note: there are 5 tokens in the collection, minus 2 excluded (tokenIds 0 and 1)
      //       Adds to a circulating supply of 3.
      expect(await circulatingSupply.get()).to.be.equals(1);
    });
  });

  describe("setToken()", async () => {
    it("reverts if caller is not the owner", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      await expect(
        circulatingSupply.connect(user2).setToken(collection2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows owner to set collection", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(await circulatingSupply.setToken(collection2.address));
    });

    it("emits new collection", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      await expect(circulatingSupply.setToken(collection2.address))
        .to.emit(circulatingSupply, "TokenSet")
        .withArgs(collection2.address);
    });
  });

  describe("exclude", async () => {
    it("reverts if caller is not the owner", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(
        circulatingSupply.connect(user2).exclude(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(
        circulatingSupply.exclude(SENTINEL_EXCLUSIONS)
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
      await expect(circulatingSupply.exclude(user1.address)).to.be.revertedWith(
        "Exclusion already enabled"
      );
    });

    it("enables a exclusion", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);
    });
  });

  describe("removeExclusion", async () => {
    it("reverts if caller is not the owner", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(
        circulatingSupply
          .connect(user2)
          .removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(
        circulatingSupply.removeExclusion(
          SENTINEL_EXCLUSIONS,
          SENTINEL_EXCLUSIONS
        )
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already disabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(circulatingSupply.exclude(user1.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user1.address);

      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      ).to.be.revertedWith("Exclusion already disabled");
    });

    it("disables a exclusion", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(circulatingSupply.exclude(user2.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      await expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, user2.address)
      )
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user2.address);
    });
  });

  describe("isExcluded", async () => {
    it("returns false if SENTINEL_EXCLUSIONS is provided", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(
        await circulatingSupply.isExcluded(SENTINEL_EXCLUSIONS)
      ).to.be.equals(false);
    });

    it("returns false if exclusion is not enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(await circulatingSupply.isExcluded(user2.address)).to.be.equals(
        false
      );
    });

    it("returns true if exclusion is enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      await expect(circulatingSupply.exclude(user2.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      expect(await circulatingSupply.isExcluded(user2.address)).to.be.equals(
        true
      );
    });
  });

  describe("getExclusionsPaginated", async () => {
    it("returns empty array if no exclusions are enabled.", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
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
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals(
        [[user1.address], SENTINEL_EXCLUSIONS].toString()
      );
    });

    it("returns two exclusions if two exclusions are enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [user1.address]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      await expect(circulatingSupply.exclude(user2.address))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals(
        [[user2.address, user1.address], SENTINEL_EXCLUSIONS].toString()
      );
    });
  });
});
