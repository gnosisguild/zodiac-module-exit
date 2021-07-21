// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0;

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

    Executor public executor;
    uint256 public circulatingSupply;
    address public designatedToken;

    // Mapping of denied tokens defined by the executor
    mapping(address => bool) public deniedTokens;
    modifier executorOnly() {
        require(msg.sender == address(executor), "Not authorized");
        _;
    }

    /// @dev Iterates on deniedTokens list to check if one of the requested tokens is added
    /// @param tokens Tokens requested to be claimed
    modifier onlyValidTokens(address[] calldata tokens) {
        for (uint8 i; i < tokens.length; i++) {
            require(
                !deniedTokens[tokens[i]],
                "onlyValidTokens: Invalid token has been sent"
            );
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
        require(
            address(executor) == address(0),
            "Module is already initialized"
        );
        require(
            _designatedToken != address(0),
            "setUp: Designated token address can not be zero"
        );
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
            require(
                !deniedTokens[tokens[i]],
                "addToDenyList: Token already added to the list"
            );
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
            require(
                deniedTokens[tokens[i]],
                "removeFromDenylist: Token not added to the list"
            );
            deniedTokens[tokens[i]] = false;
        }
    }

    /// @dev Change the designated token address variable
    /// @param _token Address of new designated token
    /// @notice Designated token address can not be zero
    function setDesignatedToken(address _token) external executorOnly {
        require(
            _token != address(0),
            "setDesignatedToken: Token address can not be zero"
        );
        designatedToken = _token;
    }

    function setCirculatingSupply(uint256 _circulatingSupply)
        external
        executorOnly
    {
        circulatingSupply = _circulatingSupply;
    }

    function getCirculatingSupply() external view returns (uint256) {
        return circulatingSupply;
    }
}
