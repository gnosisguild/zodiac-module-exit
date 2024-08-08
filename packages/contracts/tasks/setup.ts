import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  predictProxyAddress,
  readMastercopyArtifact,
  encodeDeployProxy,
} from "zodiac-core";

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
  const [deployer] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", deployer.address);
  const exclusions = taskArgs.exclusions ? taskArgs.exclusions.split(",") : [];

  const contract =
    taskArgs.type === "ERC721"
      ? "CirculatingSupplyERC721"
      : "CirculatingSupply";

  if (taskArgs.proxied) {
    const mastercopyArtifact = readMastercopyArtifact({
      contractName: contract,
    });

    const nonce = await deployer.getNonce();

    const mastercopy = mastercopyArtifact.address;
    const setupArgs = {
      types: ["address", "address", "address[]"],
      values: [taskArgs.owner, taskArgs.token, exclusions],
    };

    const transaction = encodeDeployProxy({
      mastercopy,
      setupArgs,
      saltNonce: nonce,
    });
    const deploymentTransaction = await deployer.sendTransaction(transaction);
    await deploymentTransaction.wait();

    console.log(
      "Circulating supply contract deployed to",
      predictProxyAddress({ mastercopy, setupArgs, saltNonce: nonce })
    );
  } else {
    const Supply = await hardhatRuntime.ethers.getContractFactory(contract);
    const supply = await Supply.deploy(
      taskArgs.owner,
      taskArgs.token,
      exclusions
    );
    console.log(
      "Circulating supply contract deployed to",
      await supply.getAddress()
    );

    console.log("Wait 10s to verify contract...");
    wait(10);

    await hardhatRuntime.run("verify:verify", {
      address: supply.getAddress(),
      constructorArguments: [taskArgs.owner, taskArgs.token, exclusions],
    });
  }
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
  const [deployer] = await hardhatRuntime.ethers.getSigners();
  console.log("Using the account:", deployer.address);

  const contract = taskArgs.type === "ERC721" ? "ExitERC721" : "ExitERC20";

  if (taskArgs.proxied) {
    const mastercopyArtifact = readMastercopyArtifact({
      contractName: contract,
    });

    const nonce = await deployer.getNonce();

    const mastercopy = mastercopyArtifact.address;
    const setupArgs = {
      types: ["address", "address", "address", "address", "address"],
      values: [
        taskArgs.owner,
        taskArgs.avatar,
        taskArgs.target,
        taskArgs.token,
        taskArgs.supply,
      ],
    };

    const transaction = encodeDeployProxy({
      mastercopy,
      setupArgs,
      saltNonce: nonce,
    });
    const deploymentTransaction = await deployer.sendTransaction(transaction);
    await deploymentTransaction.wait();

    console.log(
      "Module deployed to: ",
      predictProxyAddress({ mastercopy, setupArgs, saltNonce: nonce })
    );
  } else {
    const Module = await hardhatRuntime.ethers.getContractFactory(contract);

    const module = await Module.deploy(
      taskArgs.owner,
      taskArgs.avatar,
      taskArgs.target,
      taskArgs.token,
      taskArgs.supply
    );
    console.log("Module deployed to: ", await module.getAddress());

    console.log("Wait 10s to verify contract...");
    wait(10);

    await hardhatRuntime.run("verify:verify", {
      address: await module.getAddress(),
      constructorArguments: [
        taskArgs.owner,
        taskArgs.avatar,
        taskArgs.target,
        taskArgs.token,
        taskArgs.supply,
      ],
    });
  }
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

  await token.deploymentTransaction()?.wait(3);
  console.log("Token deployed to:", token.getAddress());

  const receiver = taskArgs.user || caller.address;
  await token.mint(receiver, BigInt(10) ** BigInt(18));

  console.log("Token minted to:", receiver);

  console.log("Wait 10s to verify contract...");
  wait(10);
  await hardhatRuntime.run("verify:verify", {
    address: await token.getAddress(),
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

  const Token =
    await hardhatRuntime.ethers.getContractFactory("TestTokenERC721");
  const token = await Token.deploy();

  await token.deploymentTransaction()?.wait(3);
  console.log("Token deployed to:", token.getAddress());

  const receiver = taskArgs.user || (await caller.getAddress());
  await token.mint(receiver as string);

  console.log("Token minted to:", receiver);

  console.log("Wait 10s to verify contract...");
  wait(10);
  await hardhatRuntime.run("verify:verify", {
    address: await token.getAddress(),
    constructorArguments: [],
  });
};

task("deployTestTokenERC721").setAction(deployTestTokenERC721);

export {};
