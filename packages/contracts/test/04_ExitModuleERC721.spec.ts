import { expect } from "chai";
import { BigNumber } from "ethers";
import { AbiCoder } from "ethers/lib/utils";
import hre, { deployments, waffle } from "hardhat";

const AddressZero = "0x0000000000000000000000000000000000000000";
const DesignatedTokenBalance = BigNumber.from(10).pow(18).mul(5); // Equal to 5
const TokenOneBalance = BigNumber.from(10).pow(6).mul(10); //  Equal to 100
const TokenTwoBalance = BigNumber.from(10).pow(12).mul(10); // Equal to 100

describe("ExitERC721", async () => {
  const [user, anotherUser] = waffle.provider.getWallets();

  const setUpToken = deployments.createFixture(async () => {
    const Token = await hre.ethers.getContractFactory("TestToken");

    const tokenOne = await Token.deploy(6);
    const tokenTwo = await Token.deploy(12);

    const tokensOrdered = [tokenOne.address, tokenTwo.address].sort(
      (a, b) => Number(a) - Number(b)
    );
    return {
      tokenOne,
      tokenTwo,
      Token,
      tokensOrdered,
    };
  });

  const setUpCollection = deployments.createFixture(async () => {
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
  });

  const baseSetup = deployments.createFixture(async () => {
    await deployments.fixture();
    const { tokenOne, tokenTwo, ...token } = await setUpToken();
    const { collection, Collection } = await setUpCollection();

    const Avatar = await hre.ethers.getContractFactory("TestAvatar");
    const avatar = await Avatar.deploy();

    await user.sendTransaction({ to: avatar.address, value: 100 });

    await tokenOne.mint(avatar.address, TokenOneBalance);
    await tokenTwo.mint(avatar.address, TokenTwoBalance);

    const CirculatingSupply = await hre.ethers.getContractFactory(
      "CirculatingSupplyERC721"
    );

    const circulatingSupply = await CirculatingSupply.deploy(
      user.address,
      collection.address,
      []
    );

    const initializeParams = new AbiCoder().encode(
      ["address", "address", "address", "address", "address"],
      [
        avatar.address,
        avatar.address,
        avatar.address,
        collection.address,
        circulatingSupply.address,
      ]
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
  });

  const setupTestWithTestAvatar = deployments.createFixture(async () => {
    const base = await baseSetup();
    const Module = await hre.ethers.getContractFactory("ExitERC721");
    const module = await Module.deploy(
      base.avatar.address,
      base.avatar.address,
      base.avatar.address,
      base.collection.address,
      base.circulatingSupply.address
    );

    const avatarExit = {
      call(func: string, params: any[]) {
        const data = module.interface.encodeFunctionData(func, params);
        return base.avatar.exec(module.address, 0, data);
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
  });

  describe("setUp() ", () => {
    it("throws if module has already been initialized", async () => {
      const { collection, circulatingSupply, initializeParams } =
        await baseSetup();
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      const module = await Module.deploy(
        user.address,
        user.address,
        user.address,
        collection.address,
        circulatingSupply.address
      );
      await expect(module.setUp(initializeParams)).to.be.revertedWith(
        "Initializable: contract is already initialized"
      );
    });

    it("throws if avatar is zero address", async () => {
      const { collection, avatar, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      await expect(
        Module.deploy(
          avatar.address,
          AddressZero,
          avatar.address,
          collection.address,
          circulatingSupply.address
        )
      ).to.be.revertedWith("Avatar can not be zero address");
    });

    it("throws if target is zero address", async () => {
      const { collection, avatar, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      await expect(
        Module.deploy(
          avatar.address,
          avatar.address,
          AddressZero,
          collection.address,
          circulatingSupply.address
        )
      ).to.be.revertedWith("Target can not be zero address");
    });

    it("should emit event because of successful set up", async () => {
      const { collection, avatar, circulatingSupply } = await baseSetup();
      const Module = await hre.ethers.getContractFactory("ExitERC721");
      const module = await Module.deploy(
        avatar.address,
        avatar.address,
        avatar.address,
        collection.address,
        circulatingSupply.address
      );

      await module.deployed();

      await expect(module.deployTransaction)
        .to.emit(module, "ExitModuleSetup")
        .withArgs(user.address, avatar.address);
    });
  });

  describe("exit()", () => {
    const getBalances = async ({ avatar, tokenOne, tokenTwo }: any) => {
      const responses = await Promise.all([
        waffle.provider.getBalance(avatar.address),
        tokenOne.balanceOf(avatar.address) as Promise<BigNumber>,
        tokenTwo.balanceOf(avatar.address) as Promise<BigNumber>,

        waffle.provider.getBalance(user.address),
        tokenOne.balanceOf(user.address) as Promise<BigNumber>,
        tokenTwo.balanceOf(user.address) as Promise<BigNumber>,
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
      await collection.approve(module.address, tokenId);
      await avatarExit.addToDenyList([tokenOne.address]);
      await avatar.setModule(module.address);
      await expect(
        module.exit(tokenId, [tokenOne.address, tokenTwo.address])
      ).to.be.revertedWith(`Denied token`);
    });

    it("reverts if tokens[] is unorderred", async () => {
      const { avatar, module, collection, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(module.address, tokenId);
      await avatar.setModule(module.address);
      await expect(
        module.exit(tokenId, [...tokensOrdered].reverse())
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("reverts if tokens[] contains duplicates", async () => {
      const { avatar, module, collection, tokenOne } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(module.address, tokenId);
      await avatar.setModule(module.address);
      await expect(
        module.exit(tokenId, [tokenOne.address, tokenOne.address])
      ).to.be.revertedWith("tokens[] is out of order or contains a duplicate");
    });

    it("should returns 20% of the avatar's assets if exit with 1 of 5 tokens", async () => {
      const { avatar, module, collection, tokenOne, tokenTwo, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(module.address, tokenId);
      await avatar.setModule(module.address);

      const withdrawPercentage = 0.2; // Withdraw 20%
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
      expect(afterBalances.avatar.eth.toNumber()).to.be.equal(
        previousBalances.avatar.eth.toNumber() * (1 - withdrawPercentage)
      );
      expect(afterBalances.avatar.token1.toNumber()).to.be.equal(
        previousBalances.avatar.token1.toNumber() * (1 - withdrawPercentage)
      );
      expect(afterBalances.avatar.token2.toNumber()).to.be.equal(
        previousBalances.avatar.token2.toNumber() * (1 - withdrawPercentage)
      );

      // Check User Balances
      // can't calculate exactly due to gas costs
      expect(afterBalances.user.eth.gt(previousBalances.user.eth));

      expect(afterBalances.user.token1.toNumber()).to.be.equal(
        previousBalances.user.token1.toNumber() +
          previousBalances.avatar.token1.toNumber() * withdrawPercentage
      );

      expect(afterBalances.user.token2.toNumber()).to.be.equal(
        previousBalances.user.token2.toNumber() +
          previousBalances.avatar.token2.toNumber() * withdrawPercentage
      );
    });

    it("should returns 10% of the avatar's assets if exit with 1 of 10 tokens", async () => {
      const { avatar, module, collection, tokenOne, tokenTwo, tokensOrdered } =
        await setupTestWithTestAvatar();
      const tokenId = 1;
      await collection.approve(module.address, tokenId);
      await avatar.setModule(module.address);

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
      expect(afterBalances.avatar.eth.toNumber()).to.be.equal(
        previousBalances.avatar.eth.toNumber() * (1 - withdrawPercentage)
      );
      expect(afterBalances.avatar.token1.toNumber()).to.be.equal(
        previousBalances.avatar.token1.toNumber() * (1 - withdrawPercentage)
      );
      expect(afterBalances.avatar.token2.toNumber()).to.be.equal(
        previousBalances.avatar.token2.toNumber() * (1 - withdrawPercentage)
      );

      // Check User Balances
      // can't calculate exactly due to gas costs
      expect(afterBalances.user.eth.gt(previousBalances.user.eth));

      expect(afterBalances.user.token1.toNumber()).to.be.equal(
        previousBalances.user.token1.toNumber() +
          previousBalances.avatar.token1.toNumber() * withdrawPercentage
      );

      expect(afterBalances.user.token2.toNumber()).to.be.equal(
        previousBalances.user.token2.toNumber() +
          previousBalances.avatar.token2.toNumber() * withdrawPercentage
      );
    });
  });

  describe("getCirculatingSupply", () => {
    it("should return circulating supply ", async () => {
      const { module } = await setupTestWithTestAvatar();
      const circulatingSupply = await module.getCirculatingSupply();
      expect(circulatingSupply).to.be.instanceOf(BigNumber);
      expect(circulatingSupply.toNumber()).to.be.equal(5);
    });
  });

  describe("setCirculatingSupply()", () => {
    it("throws if avatar is msg.sender is not the owner", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setCirculatingSupply(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("should set new circulating supply", async () => {
      const { module, CirculatingSupply, collection, avatarExit } =
        await setupTestWithTestAvatar();

      const circulatingSupply2 = await CirculatingSupply.deploy(
        user.address,
        collection.address,
        []
      );

      await avatarExit.setCirculatingSupply(circulatingSupply2.address);
      const circulatingSuppyAddress = await module.circulatingSupply();
      expect(circulatingSuppyAddress).to.be.equal(circulatingSupply2.address);
    });
  });
  //
  describe("setCollection()", () => {
    it("should set designated token", async () => {
      const { module, avatar, Collection, avatarExit } =
        await setupTestWithTestAvatar();
      const newCollection = await Collection.deploy();
      await avatarExit.setCollection(newCollection.address);
      const newCollectionAddress = await module.collection();
      expect(newCollectionAddress).to.be.equal(newCollection.address);
    });

    it("throws if avatar is msg.sender is not the avatar", async () => {
      const { module } = await setupTestWithTestAvatar();
      await expect(module.setCollection(AddressZero)).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });
});
