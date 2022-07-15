# Zodiac Exit Module Setup Guide

This guide shows how to setup the Exit module with a Gnosis Safe on the Rinkeby testnetwork.

The Exit Module belongs to the [Zodiac](https://github.com/gnosis/zodiac) collection of tools. If you have any questions about Zodiac, join the [Gnosis Guild Discord](https://discord.gg/wwmBWTgyEq). Follow [@GnosisGuild](https://twitter.com/gnosisguild) on Twitter for updates. 

## Prerequisites

To start the process you need to create a Safe on the Rinkeby test network (e.g. via https://rinkeby.gnosis-safe.io).

For the hardhat tasks to work, the environment needs to be properly configured. See the [sample env file](../.env.sample) for more information. In order to deploy the Exit Module, two contracts are needed: a designated token and circulating supply.

First, deployment of the designated token can be done using the following hardhat command:

```bash
yarn hardhat deployDesignatedToken --user 0xRECEIVER_OF_TOKENS --network rinkeby
```

Note: In this script, one (1) token is minted to the address passed as the user parameter. If no user parameter is given, then the signer of transaction will receive the minted token by default.

This should return the address of the deployed token. For this guide, we will assume this address to be `0x0000000000000000000000000000000000000100`.

Next, in order to deploy the circulating supply contract, the following command can be used:

```bash
yarn hardhat deployCirculatingSupply --owner <owner_address> --token 0x0000000000000000000000000000000000000100
```

This should return the address of the deployed circulating supply contract. For this guide we assume this to be `0x1230000000000000000000000000000000000900`.

There are more optional parameters. For more information on these, run `yarn hardhat deployCirculatingSupply --help`. Additionally, this deployment can be done through a proxy factory with the `proxied` flag. For more information about factory deployment, continue to the end of the section below.


## Deploying the module

The module has three variables which must be set:

- `Owner`: Address that can call setter functions
- `Avatar`: Address of the DAO (e.g. a Gnosis Safe)
- `Target`: Address on which the module will call `execModuleTransaction()`

Hardhat tasks can be used to deploy a Exit Module instance. There are two different ways to deploy the module. Via a normal deployment, passing arguments to the constructor (without the `proxied` flag), or by deploying a proxy via a [Minimal Proxy Factory](https://eips.ethereum.org/EIPS/eip-1167) with the `proxied` flag to save on gas costs.

The master copy and factory address can be found in the [Zodiac repository](https://github.com/gnosis/zodiac/blob/master/src/factory/constants.ts) and these are the addresses that are going to be used when deploying the module through factory.

These setup tasks require the following parameters (also mentioned above):

- `Owner`: Address that can call setter functions
- `Avatar`: Address of the DAO (e.g Safe)
- `Target`: Address on which the module will call `execModuleTransaction()` (this is the contract that will execute the transactions)
- `Token`: Address of the designated token
- `Supply`: Address of the circulating supply contract 
- `proxied` (optional): Deploys the module through a proxy factory

There are more optional parameters. For more information on these optional paramters, run `yarn hardhat setup --help`.

An example for this on Rinkeby would be:

```bash
yarn hardhat --network rinkeby setup --owner <owner_address> --avatar <avatar_address> --target <target_address> --token 0x0000000000000000000000000000000000000100 --supply 0x1230000000000000000000000000000000000900 --proxied true`
```

This should return the address of the deployed Exit Module. For this guide we assume this to be `0x9797979797979797979797979797979797979797`.

Once the module has been deployed, you should verify the source code. (Note: It is likely that Etherscan will verify it automatically, but just in case, you should verify it yourself.) If you use a network that is Etherscan compatible, and you configure the `ETHERSCAN_API_KEY` in your environment, you can use the provided hardhat task to do this.

Please note that the supply argument above must be the address of the  circulating supply contract that was deployed through the setup scripts. You can check the setup script logs to obtain the address.

An example for this on Rinkeby would be:
```bash
yarn hardhat --network rinkeby verifyEtherscan --module 0x9797979797979797979797979797979797979797 --owner <owner_address> --avatar <avatar_address> --target <target_address> --token 0x0000000000000000000000000000000000000100 --supply 0x1230000000000000000000000000000000000900`
```

## Enabling the module

To allow the Exit Module to actually execute transactions, you must enable it on the Gnosis Safe to which it is connected. For this, you can use the Zodiac Safe app in the [Gnosis Safe UI](https://gnosis-safe.io/app/) to add a "custom module".


## Executing an Exit

In order to test the Exit Module execution on Rinkeby, you will need some ERC20 tokens. If you don't have any to test, you can get some at https://app.compound.finance/ with the following steps (**make sure you are on Rinkeby testnetwork**): 1) Connect wallet, and click on any token in the supply markets list. 2) A modal will appear. Select the tab "Withdraw" and click on "Faucet". 3) This will trigger a transaction that will send the Rinkeby network tokens you selected to your account.

Request at least two tokens and send them to the Gnosis Safe address.

Next, you will need to give the Exit contract an allowance of the designated tokens, which were minted as part of running the `deployDesignatedToken` task. You can do this by calling the `approve` function of the token on Etherscan (the token will be verified on deployment) and passing 1000000000000000000 as the amount as well as the Exit contract's address as the spender.

To execute the Exit, call the `exit(uint256 amountToRedeem, address[] tokens)` function with the same account, passing as arguments the tokens' addresses that you sent to the Gnosis Safe to claim a payout of these tokens. Example of arguments:

- Amount to redeem: `1000000000000000`
- Tokens: `["0xa0533da0743a5517736beb1309ec0bdaa3e960b9", "0x14796a730446112eb5cbc234db9f116ea0e9bbdb"]`

## Deploy a master copy

The master copy contracts can be deployed through the `yarn deploy` command. Note that this only should be done if the Bridge Module contracts are updated. The ones referred to on the [Zodiac repository](https://github.com/gnosis/zodiac/blob/master/src/factory/constants.ts) should be used.