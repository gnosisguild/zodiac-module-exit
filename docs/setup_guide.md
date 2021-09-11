# Exit Setup Guide

This guide shows how to setup the Exit module with a Gnosis Safe on the Rinkeby testnetwork.

## Prerequisites

To start the process you need to create a Safe on the Rinkeby test network (e.g. via https://rinkeby.gnosis-safe.io).

For the hardhat tasks to work the environment needs to be properly configured. See the [sample env file](../.env.sample) for more information.

In order to deploy the Exit Module, two contracts are needed: a designated token and circulating supply.

First, deployment of the designated token can be done using the following hardhat command:

```bash
yarn hardhat deployDesignatedToken --user 0xRECEIVER_OF_TOKENS --network rinkeby
```

Note: In this script, one (1) token is minted to the address passed as the user parameter, if nothing is given then the signer of transaction will receive the minted token

This should return the address of the deployed token. For this guide we assume this to be `0x0000000000000000000000000000000000000100`

Note 2: If you want to test the exit function (the how-to is described below) - You will need to give allowance of your designated tokens to the safe, you can do this calling the `approve` function of the token from etherscan (The token will be verified on deployment) and passing 1000000000000000000 as the amount and the safe address the spender

In order to deploy the circulating supply contract, the following command can be used:

```bash
yarn hardhat deployCirculatingSupply --owner <owner_address> --token 0x0000000000000000000000000000000000000100
```
There are more optional parameters, for more information run `yarn hardhat deployCirculatingSupply --help`. Also, this deployment can be done through a proxy factory with the `proxied` flag, for more information about factory deployment check **Deploying the module** section


This should return the address of the deploy Circulating Supply contract. For this guide we assume this to be `0x1230000000000000000000000000000000000900`

## Deploying the module

The module has three attributes:

- Owner: address that can call setter functions
- Avatar: address of the DAO (e.g Safe)
- Target: address that the module will call `execModuleTransaction()` on.

Hardhat tasks can be used to deploy a Exit module instance. There are two different ways to deploy the module, the first one is through a normal deployment and passing arguments to the constructor (without the `proxied` flag), or, deploy the Module through a [Minimal Proxy Factory](https://eips.ethereum.org/EIPS/eip-1167) and save on gas costs (with the `proxied` flag) - The master copy and factory address can be found in the [zodiac repository](https://github.com/gnosis/zodiac/blob/master/src/factory/constants.ts) and these are the addresses that are going to be used when deploying the module through factory.

This task requires the following parameters:
- `owner` - the address of the owner
- `avatar` - the address of the avatar (e.g. Safe)
- `target` - the address of the target, this is the contract that execute the transactions
- `token` - the address of the designated token
- `supply` - circulating supply contract address
- `proxied` (optional) - Deploys the module through a proxy factory

There are more optional parameters, for more information run `yarn hardhat setup --help`.

An example for this on rinkeby would be:

```bash
yarn hardhat --network rinkeby setup --owner <owner_address> --avatar <avatar_address> --target <target_address> --token 0x0000000000000000000000000000000000000100 --supply 0x1230000000000000000000000000000000000900 --proxied true`
```

This should return the address of the deployed Exit module. For this guide we assume this to be `0x9797979797979797979797979797979797979797`

Once the module is deployed you should verify the source code (Note: Probably etherscan will verify it automatically, but just in case). If you use a network that is Etherscan compatible and you configure the `ETHERSCAN_API_KEY` in your environment you can use the provided hardhat task to do this.

Please note that this supply argument must be the address of the deployed Circulating Supply contract that was deployed on the setup scripts. Check the setup script logs in order to get the address

An example for this on Rinkeby would be:
```bash
yarn hardhat --network rinkeby verifyEtherscan --module 0x9797979797979797979797979797979797979797 --owner <owner_address> --avatar <avatar_address> --target <target_address> --token 0x0000000000000000000000000000000000000100 --supply 0x1230000000000000000000000000000000000900`
```

## Enabling the module

To allow the Exit module to actually work it is required to enable it on the Safe that it is connected to. For this it is possible to use the Transaction Builder on https://rinkeby.gnosis-safe.io. For this you can follow our tutorial on [adding a module](https://help.gnosis-safe.io/en/articles/4934427-add-a-module).

## Executing the exit

In order to test the exit execution on rinkeby, you will need some ERC20 tokens. If you don't have any to test, you can get some at: https://app.compound.finance/ with the following steps: (**Make sure you are on rinkeby**) - Connect wallet, click on any token in the supply markets list, a modal will appear, select the tab "Withdraw" and click on "Faucet"; this will trigger a transaction that will send you some tokens to your account (the one you selected).

Request at least two tokens and send them to the Safe Address.

Reminder: You need to give allowance to the Safe, check **Prerequisites** section for more information.

To execute the exit, call the `exit(uint256 amountToRedeem, address[] tokens)` function with the account that received the designated tokens when you deployed it and passing as arguments the tokens addresses that you sent to the Safe (So it can pay you back those tokens). Example of arguments:

- Amount to redeem: `1000000000000000`
- Tokens: `["0xa0533da0743a5517736beb1309ec0bdaa3e960b9", "0x14796a730446112eb5cbc234db9f116ea0e9bbdb"]`

### Deploy a master copy

The master copy contracts can be deployed through `yarn deploy` command. Note that this only should be done if the Exit Module contract gets an update and the ones referred on the [zodiac repository](https://github.com/gnosis/zodiac/blob/master/src/factory/constants.ts) should be used.