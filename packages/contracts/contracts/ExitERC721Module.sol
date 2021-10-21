// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "./ExitBase.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract ExitERC721 is ExitBase {
    ERC721Enumerable public collection;

    // @dev Initialize function, will be triggered when a new proxy is deployed
    // @param _owner Address of the owner
    // @param _avatar Address of the avatar (e.g. a Safe or Delay Module)
    // @param _target Address that this module will pass transactions to
    // @param _designatedToken Address of the ERC20 token that will define the share of users
    // @notice Designated token address can not be zero
    constructor(
        address _owner,
        address _avatar,
        address _target,
        address _collection
    ) {
        bytes memory initParams = abi.encode(
            _owner,
            _avatar,
            _target,
            _collection
        );
        setUp(initParams);
    }

    function setUp(bytes memory initParams) public override {
        (
            address _owner,
            address _avatar,
            address _target,
            address _collection
        ) = abi.decode(initParams, (address, address, address, address));
        __Ownable_init();
        require(_avatar != address(0), "Avatar can not be zero address");
        require(_target != address(0), "Target can not be zero address");
        avatar = _avatar;
        target = _target;
        collection = ERC721Enumerable(_collection);

        transferOwnership(_owner);

        emit ExitModuleSetup(msg.sender, _avatar);
    }

    // @dev Execute the share of assets and the transfer of designated tokens
    // @param tokenId of token to be used to exit
    // @param tokens Array of tokens to claim, ordered lowest to highest
    // @notice Will revert if tokens[] is not ordered highest to lowest, contains duplicates, or includes denied tokens
    function exit(uint256 tokenId, address[] calldata tokens) public {
        // TODO: Allow approved addresses to exit?
        require(
            collection.ownerOf(tokenId) == msg.sender,
            "Only token owner can exit"
        );

        // Transfer asset to avatar (safe)
        // TODO: use safeTransferFrom or transferForm?
        collection.safeTransferFrom(msg.sender, avatar, tokenId);

        _exit(tokens, "");
    }

    // @dev Change the designated token address variable
    // @param _token Address of new designated token
    // @notice Can only be modified by owner
    function setCollection(address _collection) public onlyOwner {
        collection = ERC721Enumerable(_collection);
    }

    function getExitAmount(uint256 supply, bytes memory)
        internal
        view
        override
        returns (uint256)
    {
        return supply / collection.totalSupply();
    }
}
