import { expect } from "chai";
import hre, { deployments, waffle } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { BigNumber, ContractFactory } from "ethers";
import { AbiCoder } from "ethers/lib/utils";

describe("CirculatingSupplyERC721", async () => {
  const [user1, user2] = waffle.provider.getWallets();
  const SENTINEL_EXCLUSIONS = BigNumber.from(2).pow(256).sub(1);
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
      collection.mint(user2.address, 4),
    ]);

    // Mint 3 tokens
    await Promise.all([
      collection2.mint(user1.address, 0),
      collection2.mint(user2.address, 1),
      collection2.mint(user2.address, 2),
    ]);

    expect(user1.sendTransaction({ to: avatar.address, value: 100 }));

    const Factory = await hre.ethers.getContractFactory("ModuleProxyFactory");
    const factory = await Factory.deploy();

    return {
      avatar,
      collection,
      collection2,
      CirculatingSupplyERC721,
      // circulatingSupply,
      // initializeParams,
      factory,
      // setupEncodeParams,
    };
  });

  const setupProxyTest = async (
    { CirculatingSupplyERC721 }: { CirculatingSupplyERC721: ContractFactory },
    params: any
  ) => {
    const circulatingSupply = await CirculatingSupplyERC721.deploy(...params);

    const initializeParams = new AbiCoder().encode(
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
        [1]
      );
      expect(await circulatingSupply.owner()).to.be.equals(user1.address);
    });

    it("sets token to collection", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [1]
      );
      expect(await circulatingSupply.collection()).to.be.equals(
        collection.address
      );
    });

    it("adds one exclusion", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [1]
      );
      const [exclusions, next]: [BigNumber[], BigNumber] =
        await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 10);
      expect(formatNumberArray(exclusions)).to.be.eql(["1"]);
      expect(next.eq(SENTINEL_EXCLUSIONS)).to.be.equals(true);
    });

    it("adds multiple exclusions", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        collection.address,
        [1]
      );
      await circulatingSupply.exclude(0);
      await circulatingSupply.exclude(2);

      const [exclusions, next]: [BigNumber[], BigNumber] =
        await circulatingSupply.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 10);

      expect(formatNumberArray(exclusions).sort()).to.be.eql(["0", "1", "2"]);
      expect(next.eq(SENTINEL_EXCLUSIONS)).to.be.equals(true);
    });
  });

  describe("setup()", async () => {
    it("throws if the circulating supply contract is already initialized", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();

      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply, initializeParams } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(circulatingSupply.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("sets owner", async () => {
      const { factory, collection, CirculatingSupplyERC721 } =
        await setupTests();

      const params = [user1.address, collection.address, [1]];
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

      const params = [user1.address, collection.address, [1]];
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
      expect(await proxy.collection()).to.be.eq(collection.address);
    });

    it("adds multiple exclusions", async () => {
      const { factory, collection, CirculatingSupplyERC721 } =
        await setupTests();

      const params = [user1.address, collection.address, [1, 2, 3]];
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
      expect(formatNumberArray(exclusions).sort()).to.be.eql(["1", "2", "3"]);
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
      expect(await circulatingSupply.get()).to.be.equals("5");
    });

    it("returns circulating supply with multiple exclusions", async () => {
      const { collection, CirculatingSupplyERC721 } = await setupTests();
      const params = [user1.address, collection.address, [0, 1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      // Note: there are 5 tokens in the collection, minus 2 excluded (tokenIds 0 and 1)
      //       Adds to a circulating supply of 3.
      expect(await circulatingSupply.get()).to.be.equals(3);
    });
  });

  describe("setCollection()", async () => {
    it("reverts if caller is not the owner", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(
        circulatingSupply.connect(user2).setCollection(collection2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows owner to set collection", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(await circulatingSupply.setCollection(collection2.address));
    });

    it("emits new collection", async () => {
      const { collection2, CirculatingSupplyERC721, collection } =
        await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(await circulatingSupply.setCollection(collection2.address))
        .to.emit(circulatingSupply, "TokenSet")
        .withArgs(collection2.address);
    });
  });

  describe("exclude", async () => {
    it("reverts if caller is not the owner", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.connect(user2).exclude(1)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.exclude(SENTINEL_EXCLUSIONS)).to.be.revertedWith(
        "Invalid exclusion"
      );
    });

    it("reverts if exclusion is already enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, []];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.exclude(1))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(1);
      expect(circulatingSupply.exclude(1)).to.be.revertedWith(
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
      expect(circulatingSupply.exclude(1))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(1);
    });

    it("excludes tokenId 0", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.exclude(0))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(0);
    });
  });

  describe("removeExclusion", async () => {
    it("reverts if caller is not the owner", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(
        circulatingSupply.connect(user2).removeExclusion(SENTINEL_EXCLUSIONS, 1)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(
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
      expect(circulatingSupply.exclude(2))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(2);
      expect(circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, 2))
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(user1.address);
      expect(
        circulatingSupply.removeExclusion(SENTINEL_EXCLUSIONS, 2)
      ).to.be.revertedWith("Exclusion already disabled");
    });

    it("disables a exclusion", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.exclude(2))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(2);
      expect(circulatingSupply.removeExclusion(1, 2))
        .to.emit(circulatingSupply, "ExclusionRemoved")
        .withArgs(2);
    });
  });

  describe("isExcluded", async () => {
    it("returns false if SENTINEL_EXCLUSIONS is provided", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
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
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(await circulatingSupply.isExcluded(2)).to.be.equals(false);
    });

    it("returns true if exclusion is enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );

      expect(await circulatingSupply.exclude(2))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(user2.address);
      expect(await circulatingSupply.isExcluded(2)).to.be.equals(true);
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
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals([[1], SENTINEL_EXCLUSIONS].toString());
    });

    it("returns two exclusions if two exclusions are enabled", async () => {
      const { CirculatingSupplyERC721, collection } = await setupTests();
      const params = [user1.address, collection.address, [1]];
      const { circulatingSupply } = await setupProxyTest(
        { CirculatingSupplyERC721 },
        params
      );
      expect(circulatingSupply.exclude(0))
        .to.emit(circulatingSupply, "ExclusionAdded")
        .withArgs(0);
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );
      tx = tx.toString();
      expect(tx).to.be.equals([[0, 1], SENTINEL_EXCLUSIONS].toString());
    });
  });
});
