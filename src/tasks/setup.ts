import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";
import { BigNumber, Contract } from "ethers";
import { AbiCoder } from "ethers/lib/utils";

const AddressOne = "0x0000000000000000000000000000000000000001";

task("setup", "deploy a Exit Module")
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of the designated token",
    BigNumber.from(10).pow(18).mul(10).toString(),
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);

    const Supply = await hardhatRuntime.ethers.getContractFactory(
      "CirculatingSupply"
    );
    const Module = await hardhatRuntime.ethers.getContractFactory("Exit");

    const supply = await Supply.deploy(taskArgs.supply);
    const module = await Module.deploy(
      taskArgs.owner,
      taskArgs.avatar,
      taskArgs.token,
      supply.address
    );

    console.log("Circulating Supply contract deployed to:", supply.address);
    console.log("Module deployed to:", module.address);
  });

task("factorySetup", "Deploy and initialize Safe Exit through a Proxy Factory")
  .addParam("factory", "Address of the Proxy Factory", undefined, types.string)
  .addParam(
    "mastercopy",
    "Address of the Safe Exit Master Copy",
    undefined,
    types.string
  )
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of designated token",
    BigNumber.from(10).pow(18).mul(10).toString(),
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);

    const FactoryAbi = [
      `function deployModule(
        address masterCopy, 
        bytes memory initializer
      ) public returns (address proxy)`,
    ];

    const Supply = await hardhatRuntime.ethers.getContractFactory(
      "CirculatingSupply"
    );

    const supply = await Supply.deploy(taskArgs.supply);
    const Factory = new Contract(taskArgs.factory, FactoryAbi, caller);

    const encodedData = new AbiCoder().encode(
      ["address", "address", "address", "address"],
      [taskArgs.owner, taskArgs.avatar, taskArgs.token, supply.address]
    );

    const Module = await hardhatRuntime.ethers.getContractFactory("Exit");

    const initParams = Module.interface.encodeFunctionData("setUp", [
      encodedData,
    ]);

    const receipt = await Factory.deployModule(
      taskArgs.mastercopy,
      initParams
    ).then((tx: any) => tx.wait(3));
    console.log("Circulating Supply contract deployed to:", supply.address);
    console.log("Module deployed to:", receipt.logs[1].address);
  });

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("module", "Address of the Safe Exit", undefined, types.string)
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Address of circulating supply contract",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    await hardhatRuntime.run("verify", {
      address: taskArgs.module,
      constructorArgsParams: [
        taskArgs.owner,
        taskArgs.avatar,
        taskArgs.token,
        taskArgs.supply,
      ],
    });
  });

task("deployDesignatedToken")
  .addParam(
    "user",
    "User that will receive tokens after deployment",
    "",
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);

    const Token = await hardhatRuntime.ethers.getContractFactory("TestToken");
    const token = await Token.deploy(18);

    await token.deployTransaction.wait(3);
    console.log("Token deployed to:", token.address);

    const receiver = taskArgs.user || caller.address;
    await token.mint(receiver, BigNumber.from(10).pow(18));

    console.log("Token minted to:", receiver);
    await hardhatRuntime.run("verify:verify", {
      address: token.address,
      constructorArguments: [18],
    });
  });

export {};
