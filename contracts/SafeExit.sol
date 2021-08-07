// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@gnosis/zodiac/contracts/core/Module.sol";

import "./CirculatingSupply.sol";

contract SafeExit is Module {
    ERC20 public designatedToken;
    CirculatingSupply public circulatingSupply;

    event SafeExitModuleSetup(address indexed initiator, address indexed safe);
    event ExitSuccessful(address indexed leaver);

    /// @notice Mapping of denied tokens defined by the executor
    mapping(address => bool) public deniedTokens;

    constructor(
        address _executor,
        address _designatedToken,
        address _circulatingSupply
    ) {
        setUp(_executor, _designatedToken, _circulatingSupply);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param _executor Address of the executor (e.g. a Safe or Delay Module)
    /// @param _designatedToken Address of the ERC20 token that will define the share of users
    /// @param _circulatingSupply Circulating Supply of designated token
    /// @notice Designated token address can not be zero
    function setUp(
        address _executor,
        address _designatedToken,
        address _circulatingSupply
    ) public {
        require(executor == address(0), "Module is already initialized");
        executor = _executor;
        designatedToken = ERC20(_designatedToken);
        circulatingSupply = CirculatingSupply(_circulatingSupply);

        emit SafeExitModuleSetup(msg.sender, _executor);
    }

    /// @dev Execute the share of assets and the transfer of designated tokens
    /// @param amountToBurn amount to be sent to the owner
    /// @param tokens Array of tokens that the leaver will recieve
    /// @notice will throw if a token sent is added in the denied token list
    function exit(uint256 amountToBurn, address[] calldata tokens) public {
        require(
            designatedToken.balanceOf(msg.sender) >= amountToBurn,
            "Amount to burn is greater than balance"
        );
        address owner = owner();
        // 0x23b872dd - bytes4(keccak256("transferFrom(address,address,uint256)"))
        bytes memory data = abi.encodeWithSelector(
            0x23b872dd,
            msg.sender,
            owner,
            amountToBurn
        );

        require(
            exec(address(designatedToken), 0, data, Enum.Operation.Call),
            "Error on exit execution"
        );

        for (uint8 i = 0; i < tokens.length; i++) {
            require(!deniedTokens[tokens[i]], "Invalid token");
            transferToken(tokens[i], msg.sender, amountToBurn);
        }

        emit ExitSuccessful(msg.sender);
    }

    /// @dev Execute a token transfer through the executor
    /// @param token address of token to transfer
    /// @param leaver address that will receive the transfer
    function transferToken(
        address token,
        address leaver,
        uint256 amountToBurn
    ) private {
        address owner = owner();
        uint256 ownerBalance = ERC20(token).balanceOf(owner);
        uint256 supply = getCirculatingSupply();
        uint256 amount = (amountToBurn * ownerBalance) / supply;
        // 0xa9059cbb - bytes4(keccak256("transfer(address,uint256)"))
        bytes memory data = abi.encodeWithSelector(0xa9059cbb, leaver, amount);
        require(
            exec(token, 0, data, Enum.Operation.Call),
            "Error on token transfer"
        );
    }

    /// @dev Add a batch of token addresses to denied tokens list
    /// @param tokens Batch of addresses to add into the denied token list
    /// @notice Can not add duplicate token address or it will throw
    function addToDenylist(address[] calldata tokens) external onlyOwner {
        for (uint8 i; i < tokens.length; i++) {
            require(!deniedTokens[tokens[i]], "Token already denied");
            deniedTokens[tokens[i]] = true;
        }
    }

    /// @dev Remove a batch of token addresses from denied tokens list
    /// @param tokens Batch of addresses to be removed from the denied token list
    /// @notice If a non denied token address is passed, the function will throw
    function removeFromDenylist(address[] calldata tokens) external onlyOwner {
        for (uint8 i; i < tokens.length; i++) {
            require(deniedTokens[tokens[i]], "Token not denied");
            deniedTokens[tokens[i]] = false;
        }
    }

    /// @dev Change the designated token address variable
    /// @param _token Address of new designated token
    /// @notice Can only be modified by executor
    function setDesignatedToken(address _token) public onlyOwner {
        designatedToken = ERC20(_token);
    }

    function getCirculatingSupply() public view returns (uint256) {
        return circulatingSupply.get();
    }
}
