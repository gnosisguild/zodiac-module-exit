import { task } from "hardhat/config";

import { writeMastercopyFromBuild } from "@gnosis-guild/zodiac-core";

import packageJson from "../package.json";

const AddressOne = "0x0000000000000000000000000000000000000001";

task(
  "extract:mastercopy",
  "Extracts and persists current mastercopy build artifacts",
).setAction(async (_, hre) => {
  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "ExitERC20",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ExitModule/ExitERC20Module.sol",
    }),
    constructorArgs: {
      types: ["address", "address", "address", "address", "address"],
      values: [AddressOne, AddressOne, AddressOne, AddressOne, AddressOne],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });

  writeMastercopyFromBuild({
    contractVersion: packageJson.version,
    contractName: "ExitERC721",
    compilerInput: await hre.run("verify:etherscan-get-minimal-input", {
      sourceName: "contracts/ExitModule/ExitERC721Module.sol",
    }),
    constructorArgs: {
      types: ["address", "address", "address", "address", "address"],
      values: [AddressOne, AddressOne, AddressOne, AddressOne, AddressOne],
    },
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
  });
});
