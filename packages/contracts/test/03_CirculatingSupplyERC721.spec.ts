import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { AbiCoder } from "ethers";
import hre from "hardhat";
import { deployFactories, deployProxy } from "zodiac-core";

import createAdapter from "./createEIP1193";

const AddressTwo = "0x0000000000000000000000000000000000000002";

describe("CirculatingSupplyERC721", async () => {
  const [user1, user2, user3, , , , , , deployer] =
    await hre.ethers.getSigners();
  const eip1193Provider = createAdapter({
    provider: hre.network.provider,
    signer: deployer,
  });
  const SENTINEL_EXCLUSIONS = "0x0000000000000000000000000000000000000001";
  const saltNonce = "0xfa";

  async function setupTests() {
    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const Collection = await hre.ethers.getContractFactory("TestCollection");
    const avatar = await Avatar.deploy();
    const collection = await Collection.deploy();
    const collection2 = await Collection.deploy();
    const CirculatingSupplyERC721 = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC721"
    );

    const circulatingSupply = await CirculatingSupplyERC721.deploy(
      AddressTwo,
      AddressTwo,
      [AddressTwo]
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

    await deployFactories({ provider: eip1193Provider });

    return {
      avatar,
      collection,
      collection2,
      CirculatingSupplyERC721,
      circulatingSupply,
      deployProxy: async (params: [string, string, string[]]) => {
        return deployProxy({
          mastercopy: await circulatingSupply.getAddress(),
          setupArgs: {
            types: ["address", "address", "address[]"],
            values: params,
          },
          saltNonce,
          provider: eip1193Provider,
        });
      },
    };
  }

  const initParams = (params: any) => {
    return AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "uint256[]"],
      params
    );
  };

  describe("constructor", async () => {
    it("sets owner", async () => {
      const { collection, CirculatingSupplyERC721 } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        await collection.getAddress(),
        [user1.address]
      );
      expect(await circulatingSupply.owner()).to.be.equals(user1.address);
    });

    it("sets token to collection", async () => {
      const { collection, CirculatingSupplyERC721 } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        await collection.getAddress(),
        [user1.address]
      );
      expect(await circulatingSupply.token()).to.be.equals(
        await collection.getAddress()
      );
    });

    it("adds one exclusion", async () => {
      const { collection, CirculatingSupplyERC721 } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        await collection.getAddress(),
        [user1.address]
      );
      const [exclusions, next] = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        10
      );
      expect(exclusions).to.be.eql([user1.address]);
      expect(next).to.be.equals(SENTINEL_EXCLUSIONS);
    });

    it("adds multiple exclusions", async () => {
      const { collection, CirculatingSupplyERC721 } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        await collection.getAddress(),
        []
      );
      await circulatingSupply.exclude(user1.address);
      await circulatingSupply.exclude(user2.address);

      const [exclusions, next] = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        10
      );

      expect(exclusions).to.be.eql([user2.address, user1.address]);
      expect(next).to.be.equals(SENTINEL_EXCLUSIONS);
    });
  });

  describe("setup()", async () => {
    it("throws if the circulating supply contract is already initialized", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);

      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.setUp(initParams(params))).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("sets owner", async () => {
      const { collection, deployProxy } = await loadFixture(setupTests);

      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ] as [string, string, string[]];

      const { address } = await deployProxy(params);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      expect(await proxy.owner()).to.be.eq(user1.address);
    });

    it("sets token to collection", async () => {
      const { collection, deployProxy } = await loadFixture(setupTests);

      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      expect(await proxy.token()).to.be.eq(await collection.getAddress());
    });

    it("adds multiple exclusions", async () => {
      const { collection, deployProxy } = await loadFixture(setupTests);

      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address, user2.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      const [exclusions] = await proxy.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        5
      );
      expect(exclusions).to.deep.equal([user2.address, user1.address]);
    });
  });

  describe("get()", async () => {
    it("returns circulating supply", async () => {
      const { collection, deployProxy } = await loadFixture(setupTests);
      const params = [user1.address, await collection.getAddress(), []];

      const { address } = await deployProxy(params as any);

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      expect(await proxy.get()).to.be.equals(5);
    });

    it("returns circulating supply with multiple exclusions", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address, user2.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      // Note: there are 5 tokens in the collection, minus 2 excluded (tokenIds 0 and 1)
      //       Adds to a circulating supply of 3.
      expect(await proxy.get()).to.be.equals(1);
    });
  });

  describe("setToken()", async () => {
    it("reverts if caller is not the owner", async () => {
      const { deployProxy, collection2, collection } =
        await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);

      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(
        proxy.connect(user2).setToken(await collection2.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("allows owner to set collection", async () => {
      const { collection2, collection, deployProxy } =
        await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      expect(await proxy.setToken(await collection2.getAddress()));
    });

    it("emits new collection", async () => {
      const { collection2, collection, deployProxy } =
        await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.setToken(await collection2.getAddress()))
        .to.emit(proxy, "TokenSet")
        .withArgs(await collection2.getAddress());
    });
  });

  describe("exclude", async () => {
    it("reverts if caller is not the owner", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      await expect(
        proxy.connect(user2).exclude(user2.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      await expect(proxy.exclude(SENTINEL_EXCLUSIONS)).to.be.revertedWith(
        "Invalid exclusion"
      );
    });

    it("reverts if exclusion is already enabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [user1.address, await collection.getAddress(), []];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      await expect(proxy.exclude(user1.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user1.address);
      await expect(proxy.exclude(user1.address)).to.be.revertedWith(
        "Exclusion already enabled"
      );
    });

    it("enables a exclusion", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);

      const params = [user1.address, await collection.getAddress(), []];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.exclude(user1.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user1.address);
    });
  });

  describe("removeExclusion", async () => {
    it("reverts if caller is not the owner", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(
        proxy.connect(user2).removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("reverts if exclusion is SENTINEL_EXCLUSIONS", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );
      await expect(
        proxy.removeExclusion(SENTINEL_EXCLUSIONS, SENTINEL_EXCLUSIONS)
      ).to.be.revertedWith("Invalid exclusion");
    });

    it("reverts if exclusion is already disabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [user1.address, await collection.getAddress(), []];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.exclude(user1.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user1.address);

      await expect(proxy.removeExclusion(SENTINEL_EXCLUSIONS, user1.address))
        .to.emit(proxy, "ExclusionRemoved")
        .withArgs(user1.address);
      await expect(
        proxy.removeExclusion(SENTINEL_EXCLUSIONS, user1.address)
      ).to.be.revertedWith("Exclusion already disabled");
    });

    it("disables a exclusion", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.exclude(user2.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user2.address);
      await expect(proxy.removeExclusion(SENTINEL_EXCLUSIONS, user2.address))
        .to.emit(proxy, "ExclusionRemoved")
        .withArgs(user2.address);
    });
  });

  describe("isExcluded", async () => {
    it("returns false if SENTINEL_EXCLUSIONS is provided", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];
      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      expect(await proxy.isExcluded(SENTINEL_EXCLUSIONS)).to.be.equals(false);
    });

    it("returns false if exclusion is not enabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      expect(await proxy.isExcluded(user2.address)).to.be.equals(false);
    });

    it("returns true if exclusion is enabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.exclude(user2.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user2.address);
      expect(await proxy.isExcluded(user2.address)).to.be.equals(true);
    });
  });

  describe("getExclusionsPaginated", async () => {
    it("returns empty array if no exclusions are enabled.", async () => {
      const { CirculatingSupplyERC721, collection } =
        await loadFixture(setupTests);
      const circulatingSupply = await CirculatingSupplyERC721.deploy(
        user1.address,
        await collection.getAddress(),
        []
      );
      let tx = await circulatingSupply.getExclusionsPaginated(
        SENTINEL_EXCLUSIONS,
        3
      );

      expect(tx).to.deep.equal([[], SENTINEL_EXCLUSIONS]);
    });

    it("returns one exclusion if one exclusion is enabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      let tx = await proxy.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3);
      expect(tx).to.be.deep.equals([[user1.address], SENTINEL_EXCLUSIONS]);
    });

    it("returns two exclusions if two exclusions are enabled", async () => {
      const { deployProxy, collection } = await loadFixture(setupTests);
      const params = [
        user1.address,
        await collection.getAddress(),
        [user1.address],
      ];

      const { address } = await deployProxy(params as any);
      const proxy = await hre.ethers.getContractAt(
        "CirculatingSupplyERC721",
        address
      );

      await expect(proxy.exclude(user2.address))
        .to.emit(proxy, "ExclusionAdded")
        .withArgs(user2.address);
      let tx = await proxy.getExclusionsPaginated(SENTINEL_EXCLUSIONS, 3);

      expect(tx).to.be.deep.equals([
        [user2.address, user1.address],
        SENTINEL_EXCLUSIONS,
      ]);
    });
  });
});
