import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { deployAndSetUpModule } from "@gnosis.pm/zodiac";
import { BigNumber } from "ethers";
import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

interface FactoryTaskArgs {
  proxied: boolean;
}

interface CirculatingSupplyTaskArgs extends FactoryTaskArgs {
  type: "ERC20" | "ERC721";
  owner: string;
  token: string;
  exclusions: string;
}

interface ExitSetupArgs extends FactoryTaskArgs {
  type: "ERC20" | "ERC721";
  owner: string;
  avatar: string;
  target: string;
  token: string;
  supply: string;
}

const wait = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const deployCirculatingSupply = async (
  taskArgs: CirculatingSupplyTaskArgs,
  hardhatRuntime: HardhatRuntimeEnvironment
) => {
  const [caller] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", caller.address);
  const exclusions = taskArgs.exclusions ? taskArgs.exclusions.split(",") : [];

  if (taskArgs.proxied) {
    const chainId = await hardhatRuntime.getChainId();
    const { transaction } = deployAndSetUpModule(
      "circulatingSupply",
      {
        types: ["address", "address", "address[]"],
        values: [taskArgs.owner, taskArgs.token, exclusions],
      },
      hardhatRuntime.ethers.provider,
      Number(chainId),
      Date.now().toString()
    );
    const deploymentTransaction = await caller.sendTransaction(transaction);
    const receipt = await deploymentTransaction.wait();

    console.log(
      "Circulating supply contract deployed to",
      receipt.logs[1].address
    );
    return;
  }

  const contract =
    taskArgs.type === "ERC721"
      ? "CirculatingSupplyERC721"
      : "CirculatingSupply";

  const Supply = await hardhatRuntime.ethers.getContractFactory(contract);
  const supply = await Supply.deploy(
    taskArgs.owner,
    taskArgs.token,
    exclusions
  );
  console.log("Circulating supply contract deployed to", supply.address);

  console.log("Wait 10s to verify contract...");
  wait(10);

  await hardhatRuntime.run("verify:verify", {
    address: supply.address,
    constructorArguments: [taskArgs.owner, taskArgs.token, exclusions],
  });
};

task("deployCirculatingSupply", "Deploy circulating supply contract")
  .addParam(
    "type",
    "Which token type is going to be used ERC20 or ERC721?",
    "ERC20",
    types.string
  )
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "exclusions",
    "List of address to exclude (e.g: 0xab,0xgm,0xez)",
    undefined,
    types.string,
    true
  )
  .addParam(
    "proxied",
    "Deploys contract through factory",
    false,
    types.boolean,
    true
  )
  .setAction(deployCirculatingSupply);

const setupModule = async (
  taskArgs: ExitSetupArgs,
  hardhatRuntime: HardhatRuntimeEnvironment
) => {
  const [caller] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", caller.address);

  if (taskArgs.proxied) {
    const chainId = await hardhatRuntime.getChainId();
    const { transaction } = deployAndSetUpModule(
      "exit",
      {
        types: ["address", "address", "address", "address", "address"],
        values: [
          taskArgs.owner,
          taskArgs.avatar,
          taskArgs.target,
          taskArgs.token,
          taskArgs.supply,
        ],
      },
      hardhatRuntime.ethers.provider,
      Number(chainId),
      Date.now().toString()
    );

    const deploymentTransaction = await caller.sendTransaction(transaction);
    const receipt = await deploymentTransaction.wait();

    console.log("Module deployed to:", receipt.logs[1].address);
    return;
  }

  const contract = taskArgs.type === "ERC721" ? "ExitERC721" : "ExitERC20";
  const Module = await hardhatRuntime.ethers.getContractFactory(contract);

  const module = await Module.deploy(
    taskArgs.owner,
    taskArgs.avatar,
    taskArgs.target,
    taskArgs.token,
    taskArgs.supply
  );
  console.log("Module deployed to:", module.address);

  console.log("Wait 10s to verify contract...");
  wait(10);

  await hardhatRuntime.run("verify:verify", {
    address: module.address,
    constructorArguments: [
      taskArgs.owner,
      taskArgs.avatar,
      taskArgs.target,
      taskArgs.token,
      taskArgs.supply,
    ],
  });
};

task("setup", "deploy a Exit Module")
  .addParam(
    "type",
    "Which token type is going to be used ERC20 or ERC721?",
    "ERC20",
    types.string
  )
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam(
    "avatar",
    "Address of the avatar (e.g. Safe)",
    undefined,
    types.string
  )
  .addParam("target", "Address of the target", undefined, types.string)
  .addParam("token", "Address of the designated token", undefined, types.string)
  .addParam(
    "supply",
    "Circulating supply of the designated token",
    undefined,
    types.string
  )
  .addParam("proxied", "Deploy module through proxy", false, types.boolean)
  .setAction(setupModule);

task("verifyEtherscan", "Verifies the contract on etherscan")
  .addParam("module", "Address of the Safe Exit", undefined, types.string)
  .addParam("owner", "Address of the owner", undefined, types.string)
  .addParam("target", "Address of the target", undefined, types.string)
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
        taskArgs.target,
        taskArgs.token,
        taskArgs.supply,
      ],
    });
  });

const deployDesignatedToken = async (
  taskArgs: { user: string },
  hardhatRuntime: HardhatRuntimeEnvironment
) => {
  const [caller] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", caller.address);

  const Token = await hardhatRuntime.ethers.getContractFactory("TestToken");
  const token = await Token.deploy(18);

  await token.deployTransaction.wait(3);
  console.log("Token deployed to:", token.address);

  const receiver = taskArgs.user || caller.address;
  await token.mint(receiver, BigNumber.from(10).pow(18));

  console.log("Token minted to:", receiver);

  console.log("Wait 10s to verify contract...");
  wait(10);
  await hardhatRuntime.run("verify:verify", {
    address: token.address,
    constructorArguments: [18],
  });
};

task("deployDesignatedToken")
  .addParam(
    "user",
    "User that will receive tokens after deployment",
    "",
    types.string
  )
  .setAction(deployDesignatedToken);

const deployTestTokenERC721 = async (
  taskArgs: Record<string, unknown>,
  hardhatRuntime: HardhatRuntimeEnvironment
) => {
  const [caller] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", caller.address);

  const Token = await hardhatRuntime.ethers.getContractFactory(
    "TestTokenERC721"
  );
  const token = await Token.deploy();

  await token.deployTransaction.wait(3);
  console.log("Token deployed to:", token.address);

  const receiver = taskArgs.user || caller.address;
  await token.mint(receiver);

  console.log("Token minted to:", receiver);

  console.log("Wait 10s to verify contract...");
  wait(10);
  await hardhatRuntime.run("verify:verify", {
    address: token.address,
    constructorArguments: [],
  });
};

task("deployTestTokenERC721").setAction(deployTestTokenERC721);

export {};
