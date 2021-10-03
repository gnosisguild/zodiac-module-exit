// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@gnosis.pm/zodiac/contracts/core/Module.sol";

import "./CirculatingSupply.sol";

contract Exit is Module {
    ERC20 public designatedToken;
    CirculatingSupply public circulatingSupply;

    event ExitModuleSetup(address indexed initiator, address indexed avatar);
    event ExitSuccessful(address indexed leaver);

    /// @notice Mapping of denied tokens defined by the avatar
    mapping(address => bool) public deniedTokens;

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param _owner Address of the owner
    /// @param _avatar Address of the avatar (e.g. a Safe or Delay Module)
    /// param _target Address that this module will pass transactions to
    /// @param _designatedToken Address of the ERC20 token that will define the share of users
    /// @param _circulatingSupply Circulating Supply of designated token
    /// @notice Designated token address can not be zero
    constructor(
        address _owner,
        address _avatar,
        address _target,
        address _designatedToken,
        address _circulatingSupply
    ) {
        bytes memory initParams = abi.encode(
            _owner,
            _avatar,
            _target,
            _designatedToken,
            _circulatingSupply
        );
        setUp(initParams);
    }

    function setUp(bytes memory initParams) public override {
        (
            address _owner,
            address _avatar,
            address _target,
            address _designatedToken,
            address _circulatingSupply
        ) = abi.decode(
            initParams,
            (address, address, address, address, address)
        );
        __Ownable_init();
        require(_avatar != address(0), "Avatar can not be zero address");
        avatar = _avatar;
        require(_target != address(0), "Target can not be zero address");
        target = _target;
        designatedToken = ERC20(_designatedToken);
        circulatingSupply = CirculatingSupply(_circulatingSupply);

        transferOwnership(_owner);

        emit ExitModuleSetup(msg.sender, _avatar);
    }

    /// @dev Execute the share of assets and the transfer of designated tokens
    /// @param amountToRedeem Amount to be sent to the avatar
    /// @param tokens Array of tokens to claim, orderred lowest to highest
    /// @notice Will revert if tokens[] is not orderred highest to lowest, contains duplicates, or includes denied tokens
    function exit(uint256 amountToRedeem, address[] calldata tokens) public {
        require(
            designatedToken.balanceOf(msg.sender) >= amountToRedeem,
            "Amount to redeem is greater than balance"
        );

        uint256 supply = getCirculatingSupply();

        designatedToken.transferFrom(msg.sender, avatar, amountToRedeem);

        if (avatar.balance > 0) {
            transferNativeAsset(msg.sender, amountToRedeem, supply);
        }

        address previousToken;
        for (uint8 i = 0; i < tokens.length; i++) {
            require(
                !deniedTokens[tokens[i]] &&
                    tokens[i] != address(designatedToken),
                "Denied token"
            );
            require(
                tokens[i] > previousToken,
                "tokens[] is out of order or contains a duplicate"
            );
            transferToken(tokens[i], msg.sender, amountToRedeem, supply);
            previousToken = tokens[i];
        }

        emit ExitSuccessful(msg.sender);
    }

    /// @dev Execute a token transfer through the avatar
    /// @param token address of token to transfer
    /// @param leaver address that will receive the transfer
    function transferToken(
        address token,
        address leaver,
        uint256 amountToRedeem,
        uint256 supply
    ) private {
        uint256 avatarBalance = ERC20(token).balanceOf(avatar);
        uint256 amount = (amountToRedeem * avatarBalance) / supply;
        // 0xa9059cbb - bytes4(keccak256("transfer(address,uint256)"))
        bytes memory data = abi.encodeWithSelector(0xa9059cbb, leaver, amount);
        require(
            exec(token, 0, data, Enum.Operation.Call),
            "Error on token transfer"
        );
    }

    /// @dev Execute a token transfer through the avatar
    /// @param leaver address that will receive the transfer
    function transferNativeAsset(
        address leaver,
        uint256 amountToRedeem,
        uint256 supply
    ) private {
        uint256 amount = (amountToRedeem * avatar.balance) / supply;
        require(
            exec(leaver, amount, bytes("0x"), Enum.Operation.Call),
            "Error on native asset transfer"
        );
    }

    /// @dev Add a batch of token addresses to denied tokens list
    /// @param tokens Batch of addresses to add into the denied token list
    /// @notice Can not add duplicate token address or it will throw
    /// @notice Can only be modified by owner
    function addToDenylist(address[] calldata tokens) external onlyOwner {
        for (uint8 i; i < tokens.length; i++) {
            require(!deniedTokens[tokens[i]], "Token already denied");
            deniedTokens[tokens[i]] = true;
        }
    }

    /// @dev Remove a batch of token addresses from denied tokens list
    /// @param tokens Batch of addresses to be removed from the denied token list
    /// @notice If a non-denied token address is passed, the function will throw
    /// @notice Can only be modified by owner
    function removeFromDenylist(address[] calldata tokens) external onlyOwner {
        for (uint8 i; i < tokens.length; i++) {
            require(deniedTokens[tokens[i]], "Token not denied");
            deniedTokens[tokens[i]] = false;
        }
    }

    /// @dev Change the designated token address variable
    /// @param _token Address of new designated token
    /// @notice Can only be modified by owner
    function setDesignatedToken(address _token) public onlyOwner {
        designatedToken = ERC20(_token);
    }

    /// @dev Change the circulating supply vairable
    /// @param _circulatingSupply Address of new circulating supply contract
    /// @notice Can only be modified by owner
    function setCirculatingSupply(address _circulatingSupply) public onlyOwner {
        circulatingSupply = CirculatingSupply(_circulatingSupply);
    }

    function getCirculatingSupply() public view returns (uint256) {
        return circulatingSupply.get();
    }
}
