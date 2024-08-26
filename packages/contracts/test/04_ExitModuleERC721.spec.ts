import { expect } from "chai";
import hre from "hardhat";
import { AbiCoder, ZeroAddress } from "ethers";

import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const TokenOneBalance = BigInt(10) ** BigInt(6) * 10n; //  Equal to 10
const TokenTwoBalance = BigInt(10) ** BigInt(12) * 10n; // Equal to 10

describe("ExitERC721", async () => {
  const [user, anotherUser] = await hre.ethers.getSigners();

  async function setupToken() {
    const Token = await hre.ethers.getContractFactory("TestToken");

    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);

    const tokensOrdered = [
      await tokenOne.getAddress(),
      await tokenTwo.getAddress(),
    ].sort((a, b) => Number(a) - Number(b));
    return {
      tokenOne,
      tokenTwo,
      Token,
      tokensOrdered,
    };
  }

  async function setUpCollection() {
    const Collection = await hre.ethers.getContractFactory("TestCollection");
    const collection = await Collection.deploy();

    // Mint 5 tokens
    await Promise.all([
      collection.mint(user.address, 0),
      collection.mint(user.address, 1),
      collection.mint(user.address, 2),
      collection.mint(user.address, 3),
      collection.mint(anotherUser.address, 4),
    ]);

    return {
      Collection,
      collection,
    };
  }

  async function baseSetup() {
    const { tokenOne, tokenTwo, ...token } = await setupToken();
    const { collection, Collection } = await setUpCollection();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    await user.sendTransaction({ to: await avatar.getAddress(), value: 100 });

    await tokenOne.mint(await avatar.getAddress(), TokenOneBalance);
    await tokenTwo.mint(await avatar.getAddress(), TokenTwoBalance);

    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC721",
    );

    const circulatingSupply = await CirculatingSupply.deploy(
      await avatar.getAddress(),
      await collection.getAddress(),
      await [await avatar.getAddress()],
    );

    const initializeParams = AbiCoder.defaultAbiCoder().encode(
      ["address", "address", "address", "address", "address"],
      [
        await avatar.getAddress(),
        await avatar.getAddress(),
        await avatar.getAddress(),
        await collection.getAddress(),
        await circulatingSupply.getAddress(),
      ],
    );

    return {
      Avatar,
      avatar,
      tokenOne,
      tokenTwo,
      CirculatingSupply,
      circulatingSupply,
      initializeParams,
      collection,
      Collection,
      ...token,
    };
  }

  async function setupTestWithTestAvatar() {
    const base = await loadFixture(baseSetup);
    const Module = await hre.ethers.getContractFactory("ExitERC721");
    const module = (
      await Module.deploy(
        await base.avatar.getAddress(),
        await base.avatar.getAddress(),
        await base.avatar.getAddress(),
        await base.collection.getAddress(),
        await base.circulatingSupply.getAddress(),
      )
    ).connect(user);

    const avatarExit = {
      async call(func: any, params: any[]) {
        const data = module.interface.encodeFunctionData(func, params as any);
        return base.avatar.exec(await module.getAddress(), 0, data);
      },
      addToDenyList(...params: any[]) {
        return this.call("addToDenyList", params);
      },
      setCirculatingSupply(...params: any[]) {
        return this.call("setCirculatingSupply", params);
      },
      setCollection(...params: any[]) {
        return this.call("setCollection", params);
      },
    };

    return { ...base, avatarExit, Module, module };
  }

  describe("setUp() ", () => {
    it("throws if module has already been initialized", async () => {
      const { collection, circulatingSupply, initializeParams } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      const module = await Module.deploy(
        user.address,
        user.address,
        user.address,
        await collection.getAddress(),
        await circulatingSupply.getAddress(),
      );
      await expect(module.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized",
      );
    });

    it("throws if avatar is zero address", async () => {
      const { collection, avatar, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      await expect(
        Module.deploy(
          await avatar.getAddress(),
          ZeroAddress,
          await avatar.getAddress(),
          await collection.getAddress(),
          await circulatingSupply.getAddress(),
        ),
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("throws if target is zero address", async () => {
      const { collection, avatar, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      await expect(
        Module.deploy(
          await avatar.getAddress(),
          await avatar.getAddress(),
          ZeroAddress,
          await collection.getAddress(),
          await circulatingSupply.getAddress(),
        ),
      ).to.be.revertedWith("Target can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const { collection, avatar, circulatingSupply } =
        await loadFixture(baseSetup);
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      const module = await Module.deploy(
        await avatar.getAddress(),
        await avatar.getAddress(),
        await avatar.getAddress(),
        await collection.getAddress(),
        await circulatingSupply.getAddress(),
      );

      await expect(module.deploymentTransaction())
        .to.emit(module, "ExitModuleSetup")
        .withArgs(user.address, await avatar.getAddress());
    });
  });

  describe("exit()", () => {
    const getBalances = async ({ avatar, tokenOne, tokenTwo }: any) => {
      const responses = await Promise.all([
        hre.ethers.provider.getBalance(await avatar.getAddress()),
        tokenOne.balanceOf(await avatar.getAddress()),
        tokenTwo.balanceOf(await avatar.getAddress()),
        hre.ethers.provider.getBalance(user.address),
        tokenOne.balanceOf(user.address),
        tokenTwo.balanceOf(user.address),
      ]);

      return {
        avatar: {
          eth: responses[0],
          token1: responses[1],
          token2: responses[2],
        },
        user: {
          eth: responses[3],
          token1: responses[4],
          token2: responses[5],
        },
      };
    };

    it("throws if token is added in denied tokens list", async () => {
      const { avatar, module, tokenOne, tokenTwo, collection, avatarExit } =
        await setupTestWithTestAvatar();

      const tokenId = 1;
      await collection.approve(await module.getAddress(), tokenId);
      await avatarExit.addToDenyList([await tokenOne.getAddress()]);
      await avatar.setModule(await module.getAddress());
      await expect(
        module.exit(tokenId, [
          await tokenOne.getAddress(),
          await tokenTwo.getAddress(),
        ]),
      ).to.be.revertedWith(`Denied token`);
    });

    it("reverts if tokens[] is unorderred", async () => {
      const { avatar, module, collection, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(await module.getAddress(), tokenId);
      await avatar.setModule(await module.getAddress());
      await expect(
        module.exit(tokenId, [...tokensOrdered].reverse()),
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("reverts if tokens[] contains duplicates", async () => {
      const { avatar, module, collection, tokenOne } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(await module.getAddress(), tokenId);
      await avatar.setModule(await module.getAddress());
      await expect(
        module.exit(tokenId, [
          await tokenOne.getAddress(),
          await tokenOne.getAddress(),
        ]),
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("should return 20% of the avatar's assets if exit with 1 of 5 tokens", async () => {
      const { avatar, module, collection, tokenOne, tokenTwo, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(await module.getAddress(), tokenId);
      await avatar.setModule(await module.getAddress());

      const previousBalances = await getBalances({
        avatar,
        tokenOne,
        tokenTwo,
      });
      const receipt = await module.exit(tokenId, tokensOrdered);
      const afterBalances = await getBalances({ avatar, tokenOne, tokenTwo });

      await expect(receipt)
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      // Check Avatar Balances (-20%)
      expect(afterBalances.avatar.eth).to.be.equal(
        (previousBalances.avatar.eth * 80n) / 100n,
      );
      expect(afterBalances.avatar.token1).to.be.equal(
        (previousBalances.avatar.token1 * 80n) / 100n,
      );
      expect(afterBalances.avatar.token2).to.be.equal(
        (previousBalances.avatar.token2 * 80n) / 100n,
      );

      // Check User Balances
      // can't calculate exactly due to gas costs
      // expect(afterBalances.user.eth).to.be.greaterThan(
      //   previousBalances.user.eth
      // );

      expect(afterBalances.user.token1).to.be.equal(
        previousBalances.user.token1 +
          (previousBalances.avatar.token1 * 20n) / 100n,
      );

      expect(afterBalances.user.token2).to.be.equal(
        previousBalances.user.token2 +
          (previousBalances.avatar.token2 * 20n) / 100n,
      );
    });

    it("should return 10% of the avatar's assets if exit with 1 of 10 tokens", async () => {
      const { avatar, module, collection, tokenOne, tokenTwo, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(await module.getAddress(), tokenId);
      await avatar.setModule(await module.getAddress());

      await Promise.all([
        collection.mint(anotherUser.address, 5),
        collection.mint(anotherUser.address, 6),
        collection.mint(anotherUser.address, 7),
        collection.mint(anotherUser.address, 8),
        collection.mint(anotherUser.address, 9),
      ]);

      const withdrawPercentage = 0.1; // Withdraw 10%

      const previousBalances = await getBalances({
        avatar,
        tokenOne,
        tokenTwo,
      });
      const receipt = await module.exit(tokenId, tokensOrdered);
      const afterBalances = await getBalances({ avatar, tokenOne, tokenTwo });

      await expect(receipt)
        .to.emit(module, "ExitSuccessful")
        .withArgs(user.address);

      // Check Avatar Balances (-20%)
      expect(afterBalances.avatar.eth).to.be.equal(
        (previousBalances.avatar.eth * 90n) / 100n,
      );
      expect(afterBalances.avatar.token1).to.be.equal(
        (previousBalances.avatar.token1 * 90n) / 100n,
      );
      expect(afterBalances.avatar.token2).to.be.equal(
        (previousBalances.avatar.token2 * 90n) / 100n,
      );

      // Check User Balances
      // can't calculate exactly due to gas costs
      // expect(afterBalances.user.eth.gt(previousBalances.user.eth));

      expect(afterBalances.user.token1).to.be.equal(
        previousBalances.user.token1 +
          (previousBalances.avatar.token1 * 10n) / 100n,
      );

      expect(afterBalances.user.token2).to.be.equal(
        previousBalances.user.token2 +
          (previousBalances.avatar.token2 * 10n) / 100n,
      );
    });

    it("should exit 2 users with the same amount", async () => {
      const { avatar, module, collection, tokenOne, tokenTwo, tokensOrdered } =
        await setupTestWithTestAvatar();

      await collection.approve(await module.getAddress(), 1);
      await collection.approve(await module.getAddress(), 2);

      await avatar.setModule(await module.getAddress());

      // Mint 5 more tokens -> Circulating Supply = 10
      await Promise.all([
        collection.mint(anotherUser.address, 5),
        collection.mint(anotherUser.address, 6),
        collection.mint(anotherUser.address, 7),
        collection.mint(anotherUser.address, 8),
        collection.mint(anotherUser.address, 9),
      ]);

      const initialBalances = await getBalances({
        avatar,
        tokenOne,
        tokenTwo,
      });

      // Exit with tokenId #1
      await (await module.exit(1, tokensOrdered)).wait();

      const afterFirstExitBalances = await getBalances({
        avatar,
        tokenOne,
        tokenTwo,
      });

      // Exit with tokenId #2
      await (await module.exit(2, tokensOrdered)).wait();

      const afterSecondExitBalances = await getBalances({
        avatar,
        tokenOne,
        tokenTwo,
      });

      const firstExitAmount = {
        token1:
          afterFirstExitBalances.user.token1 - initialBalances.user.token1,
        token2:
          afterFirstExitBalances.user.token2 - initialBalances.user.token2,
      };
      const secondExitAmount = {
        token1:
          afterSecondExitBalances.user.token1 -
          afterFirstExitBalances.user.token1,
        token2:
          afterSecondExitBalances.user.token2 -
          afterFirstExitBalances.user.token2,
      };

      // expect(firstExitAmount.eth).to.be.equal(secondExitAmount.eth);
      expect(firstExitAmount.token1).to.be.equal(secondExitAmount.token1);
      expect(firstExitAmount.token2).to.be.equal(secondExitAmount.token2);
    });
  });

  describe("getCirculatingSupply", () => {
    it("should return circulating supply ", async () => {
      const { module } = await setupTestWithTestAvatar();
      const circulatingSupply = await module.getCirculatingSupply();
      expect(typeof circulatingSupply).to.equal("bigint");
    });
  });

  describe("setCirculatingSupply()", () => {
    it("throws if avatar is msg.sender is not the owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setCirculatingSupply(ZeroAddress)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });

    it("should set new circulating supply", async () => {
      const { module, CirculatingSupply, collection, avatarExit } =
        await setupTestWithTestAvatar();

      const circulatingSupply2 = await CirculatingSupply.deploy(
        user.address,
        await collection.getAddress(),
        [],
      );

      await avatarExit.setCirculatingSupply(
        await circulatingSupply2.getAddress(),
      );
      const circulatingSuppyAddress = await module.circulatingSupply();
      expect(circulatingSuppyAddress).to.be.equal(
        await circulatingSupply2.getAddress(),
      );
    });
  });

  describe("setCollection()", () => {
    it("should set designated token", async () => {
      const { module, avatar, Collection, avatarExit } =
        await setupTestWithTestAvatar();
      const newCollection = await Collection.deploy();
      await avatarExit.setCollection(await newCollection.getAddress());
      const newCollectionAddress = await module.collection();
      expect(newCollectionAddress).to.be.equal(
        await newCollection.getAddress(),
      );
    });

    it("throws if avatar is msg.sender is not the avatar", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setCollection(ZeroAddress)).to.be.revertedWith(
        "Ownable: caller is not the owner",
      );
    });
  });
});
