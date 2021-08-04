import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";
import { BigNumber, Contract } from "ethers";

const AddressOne = "0x0000000000000000000000000000000000000001";

task("setup", "deploy a SafeExit Module")
  .addParam("dao", "Address of the DAO (e.g. Safe)", undefined, types.string)
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of the designated token",
    "10",
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);
    const Module = await hardhatRuntime.ethers.getContractFactory("SafeExit");
    const module = await Module.deploy(
      taskArgs.dao,
      taskArgs.token,
      taskArgs.supply
    );

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
  .addParam("dao", "Address of the DAO (e.g. Safe)", undefined, types.string)
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of designated token",
    "10",
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

    const Factory = new Contract(taskArgs.factory, FactoryAbi, caller);
    const Module = await hardhatRuntime.ethers.getContractFactory("SafeExit");

    const initParams = Module.interface.encodeFunctionData("setUp", [
      taskArgs.dao,
      taskArgs.token,
      taskArgs.supply,
    ]);

    const receipt = await Factory.deployModule(
      taskArgs.mastercopy,
      initParams
    ).then((tx: any) => tx.wait(3));
    console.log("Module deployed to:", receipt.logs[1].address);
  });

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("module", "Address of the Safe Exit", undefined, types.string)
  .addParam("dao", "Address of the DAO (e.g. Safe)", undefined, types.string)
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of designated token",
    undefined,
    types.string
  )
  .setAction(async (taskArgs, hardhatRuntime) => {
    await hardhatRuntime.run("verify", {
      address: taskArgs.module,
      constructorArgsParams: [taskArgs.dao, taskArgs.token, taskArgs.supply],
    });
  });

task("deployMasterCopy", "deploy a master copy of Safe Exit").setAction(
  async (_, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);
    const Module = await hardhatRuntime.ethers.getContractFactory("SafeExit");
    const module = await Module.deploy(AddressOne, AddressOne, 0);
    await module.deployTransaction.wait(3);

    console.log("Module deployed to:", module.address);
    await hardhatRuntime.run("verify:verify", {
      address: module.address,
      constructorArguments: [AddressOne, AddressOne, 0],
    });
  }
);

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
    const token = await Token.deploy();

    await token.deployTransaction.wait(3);
    console.log("Token deployed to:", token.address);

    const receiver = taskArgs.user || caller.address;
    await token.mint(receiver, BigNumber.from(10).pow(18));

    console.log("Token minted to:", receiver);
  });

export {};
