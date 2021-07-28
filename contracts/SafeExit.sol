// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.4;

contract Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

interface Executor {
    /// @dev Allows a Module to execute a transaction.
    /// @param to Destination address of module transaction.
    /// @param value Ether value of module transaction.
    /// @param data Data payload of module transaction.
    /// @param operation Operation type of module transaction.
    function execTransactionFromModule(
        address to,
        uint256 value,
        bytes calldata data,
        Enum.Operation operation
    ) external returns (bool success);
}

contract SafeExit {
    event SafeExitModuleSetup(address indexed initiator, address indexed safe);

    /// Designated token address can not be zero
    error DesignatedTokenCannotBeZero();

    /// Module is already initialized
    error ModuleAlreadyInitialized();

    /// Token `token` is denied
    /// @param token balance available.
    error InvalidToken(address token);

    /// `unacceptedAddress` is not authorized to execute transaction. Transaction must be triggered by executor of contract
    /// @param unacceptedAddress address that tried to execute the transaction
    error NotAuthorized(address unacceptedAddress);

    /// Token `deniedToken` can not be added twice in the list of denied tokens
    /// @param deniedToken token that is already denied
    error TokenAlreadyDenied(address deniedToken);

    /// Token `token` is not added in the denied tokens list
    /// @param token token that is not added
    error TokenNotDenied(address token);

    Executor public executor;
    uint256 public circulatingSupply;
    address public designatedToken;

    /// @notice Mapping of denied tokens defined by the executor
    mapping(address => bool) public deniedTokens;

    modifier executorOnly() {
        if (msg.sender != address(executor)) revert NotAuthorized(msg.sender);
        _;
    }

    /// @dev Iterates on deniedTokens list to check if one of the requested tokens is added
    /// @param tokens Tokens requested to be claimed
    modifier onlyValidTokens(address[] calldata tokens) {
        for (uint8 i; i < tokens.length; i++) {
            if (deniedTokens[tokens[i]]) revert InvalidToken(tokens[i]);
        }
        _;
    }

    constructor(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) {
        setUp(_executor, _designatedToken, _circulatingSupply);
    }

    /// @dev Initialize function, will be triggered when a new proxy is deployed
    /// @param _executor Address of the executor (e.g. a Safe)
    /// @param _designatedToken Address of the ERC20 token that will define the share of users
    /// @param _circulatingSupply Circulating Supply of designated token
    /// @notice Designated token address can not be zero
    function setUp(
        Executor _executor,
        address _designatedToken,
        uint256 _circulatingSupply
    ) public {
        if (address(executor) != address(0)) revert ModuleAlreadyInitialized();
        if (_designatedToken == address(0)) {
            revert DesignatedTokenCannotBeZero();
        }
        executor = _executor;
        designatedToken = _designatedToken;
        circulatingSupply = _circulatingSupply;

        emit SafeExitModuleSetup(msg.sender, address(_executor));
    }

    function exit(uint256 _amountToBurn, address[] calldata tokens)
        public
        onlyValidTokens(tokens)
    {
        // executor.execTransactionFromModule(to, value, data, operation);
    }

    /// @dev Add a batch of token addresses to denied tokens list
    /// @param tokens Batch of addresses to add into the denied token list
    /// @notice Can not add duplicate token address or it will throw
    function addToDenylist(address[] calldata tokens) external executorOnly {
        for (uint8 i; i < tokens.length; i++) {
            if (deniedTokens[tokens[i]]) {
                revert TokenAlreadyDenied(tokens[i]);
            }
            deniedTokens[tokens[i]] = true;
        }
    }

    /// @dev Remove a batch of token addresses from denied tokens list
    /// @param tokens Batch of addresses to be removed from the denied token list
    /// @notice If a non denied token address is passed, the function will throw
    function removeFromDenylist(address[] calldata tokens)
        external
        executorOnly
    {
        for (uint8 i; i < tokens.length; i++) {
            if (!deniedTokens[tokens[i]]) {
                revert TokenNotDenied(tokens[i]);
            }
            deniedTokens[tokens[i]] = false;
        }
    }

    /// @dev Change the designated token address variable
    /// @param _token Address of new designated token
    /// @notice Designated token address can not be zero
    function setDesignatedToken(address _token) public {
        if (_token == address(0)) {
            revert DesignatedTokenCannotBeZero();
        }
        designatedToken = _token;
    }

    function setCirculatingSupply(uint256 _circulatingSupply)
        external
        executorOnly
    {
        circulatingSupply = _circulatingSupply;
    }

    function getCirculatingSupply() public view returns (uint256) {
        return circulatingSupply;
    }
}
