import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { task, types } from "hardhat/config";
import { BigNumber } from "ethers";

task("setup", "deploy a SafeExit Module").setAction(
  async (taskArgs, hardhatRuntime) => {
    const [caller] = await hardhatRuntime.ethers.getSigners();
    console.log("Using the account:", caller.address);
    const Module = await hardhatRuntime.ethers.getContractFactory("SafeExit");
    const module = await Module.deploy();

    console.log("SafeExit Module deployed to:", module.address);
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
