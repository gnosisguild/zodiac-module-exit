# SafeExit Setup Guide

This guide shows how to setup the SafeExit module with a Gnosis Safe on the Rinkeby testnetwork.

## Prerequisites

To start the process you need to create a Safe on the Rinkeby test network (e.g. via https://rinkeby.gnosis-safe.io).

For the hardhat tasks to work the environment needs to be properly configured. See the [sample env file](../.env.sample) for more information.

In order to deploy the Exit Module, a designated token will be needed, for this, we can deploy one in rinkeby and mint some using the following hardhat command:

`yarn hardhat deployDesignatedToken --user RECEIVER_OF_TOKENS --network rinkeby`

Note: In this script, one (1) token is minted to the address passed as the user parameter, if nothing is given then the signer of transaction will receive the minted token

This should return the address of the deployed token. For this guide we assume this to be `0x0000000000000000000000000000000000000100`

Note 2: If you want to test the exit function (the how-to is described below) - You will need to give allowance of your designated tokens to the safe, you can do this calling the `approve` function of the token from etherscan (The token will be verified on deployment) and passing 1000000000000000000 as the amount and the safe address the spender

## Setting up the module

The first step is to deploy the module. Every Safe will have their own module. The module is linked to a Safe (called executor in the contract). The Safe can only be changed by the owner of the module.

## Deploying the module

Hardhat tasks can be used to deploy a Safe Exit instance. There are two different tasks to deploy the module, the first one is through a normal deployment and passing arguments to the constructor (with the task `setup`), or, deploy the Module through a [Minimal Proxy Factory](https://eips.ethereum.org/EIPS/eip-1167) and save on gas costs (with the task `factorySetup`) - In rinkeby the address of the Proxy Factory is: `0xd067410a85ffC8C55f7245DE4BfE16C95329D232` and the Master Copy of the Safe Exit: `0x9eCf1bDEfED95442486eb3fA3F102d23f2701E6b`.

These setup tasks requires the following parameters:

- `dao` (the address of the Safe)
- `token` (the address of the designated token)
- `supply` (circulating supply of designated token, if not provided 10e18 will be set)

An example for this on rinkeby would be:

`yarn hardhat --network rinkeby setup --dao <safe_address> --token 0x0000000000000000000000000000000000000100 --supply <circulating_supply>`

or

`yarn hardhat --network rinkeby factorySetup --factory <factory_address> --mastercopy <masterCopy_address> --dao <safe_address> --token 0x0000000000000000000000000000000000000100 --supply <circulating_supply>`

This should return the address of the deployed Exit module. For this guide we assume this to be `0x9797979797979797979797979797979797979797`

Once the module is deployed you should verify the source code (Note: If you used the factory deployment the contract should be already verified). If you use a network that is Etherscan compatible and you configure the `ETHERSCAN_API_KEY` in your environment you can use the provided hardhat task to do this.

Please note that this supply argument must be the address of the deployed Circulating Supply contract that was deployed on the setup scripts. Check the setup script logs in order to get the address

An example for this on Rinkeby would be:
`yarn hardhat --network rinkeby verifyEtherscan --module 0x9797979797979797979797979797979797979797 --dao <safe_address> --token 0x0000000000000000000000000000000000000100 --supply <circulating_supply_contract_address>`

## Enabling the module

To allow the SafeExit module to actually work it is required to enable it on the Safe that it is connected to. For this it is possible to use the Transaction Builder on https://rinkeby.gnosis-safe.io. For this you can follow our tutorial on [adding a module](https://help.gnosis-safe.io/en/articles/4934427-add-a-module).

## Executing the exit

In order to test the exit execution on rinkeby, you will need some ERC20 tokens. If you don't have any to test, you can get some at: https://app.compound.finance/ with the following steps: (**Make sure you are on rinkeby**) - Connect wallet, click on any token in the supply markets list, a modal will appear, select the tab "Withdraw" and click on "Faucet"; this will trigger a transaction that will send you some tokens to your account (the one you selected).

Request at least two tokens and send them to the Safe Address.

Reminder: You need to give allowance to the Safe, check **Prerequisites** section for more information.

To execute the exit, call the `exit(uint256 amountToRedeem, address[] tokens)` function with the account that received the designated tokens when you deployed it and passing as arguments the tokens addresses that you sent to the Safe (So it can pay you back those tokens). Example of arguments:

- Amount to redeem: `1000000000000000`
- Tokens: `["0xa0533da0743a5517736beb1309ec0bdaa3e960b9", "0x14796a730446112eb5cbc234db9f116ea0e9bbdb"]`

## Deploy a master copy

If the contract gets an update, you can deploy a new version of a Master Copy using the hardhat task `deployMasterCopy`. An example of the command would be: `yarn hardhat --network rinkeby deployMasterCopy`
