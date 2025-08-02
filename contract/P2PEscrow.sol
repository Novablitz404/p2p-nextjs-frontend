// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

contract P2PEscrow is Initializable, OwnableUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {

    // =================================================================
    //                           STATE VARIABLES
    // =================================================================

    mapping(address => bool) public isManager;
    address[] private _managerList;

    // An array to hold all arbitrator addresses for easy retrieval
    address[] private _arbitratorList;
    address[] private _approvedTokensList;
    
    // Mappings for core data structures
    mapping(address => bool) public isArbitrator;
    mapping(uint256 => Order) public orders;
    mapping(uint256 => Trade) public trades;
    mapping(address => bool) public approvedTokens;

    // Configuration set by the owner
    uint256 public platformFeeBps; // Fee in basis points (e.g., 50 for 0.5%)
    address public feeRecipient;
    uint256 public buyerPaymentTimeout; // In seconds
    uint256 public sellerReleaseTimeout; // In seconds

    uint256 private _orderCounter;
    uint256 private _tradeCounter;

    // =================================================================
    //                              STRUCTS & ENUMS
    // =================================================================

    enum OrderStatus { OPEN, CLOSED, CANCELED }
    enum TradeStatus { LOCKED, FIAT_SENT, RELEASED, CANCELED, DISPUTED }

    struct Order {
        uint256 id;
        address seller;
        address token;
        uint256 totalAmount;
        uint256 remainingAmount;
        OrderStatus status;
    }

    struct Trade {
        uint256 id;
        uint256 orderId;
        address buyer;
        uint256 amount;
        TradeStatus status;
        uint256 lockedAt;
        uint256 fiatSentAt;
    }

    // =================================================================
    //                                EVENTS
    // =================================================================

    event BuyerPaymentTimeoutUpdated(uint256 newTimeout);
    event SellerReleaseTimeoutUpdated(uint256 newTimeout);
    event ManagerAdded(address indexed account);
    event ManagerRemoved(address indexed account);
    event OrderCreated(uint256 indexed orderId, address indexed seller, address token, uint256 amount);
    event OrderCanceled(uint256 indexed orderId);
    event TradeCreated(uint256 indexed tradeId, uint256 indexed orderId, address indexed buyer, uint256 amount);
    event FiatSent(uint256 indexed tradeId);
    event TradeReleased(uint256 indexed tradeId);
    event TradeCanceled(uint256 indexed tradeId);
    event DisputeRaised(uint256 indexed tradeId);
    event DisputeResolved(uint256 indexed tradeId, address indexed winner);
    event FeeRecipientUpdated(address indexed newRecipient);
    event ArbitratorAdded(address indexed account);
    event ArbitratorRemoved(address indexed account);
    event ApprovedTokenAdded(address indexed token);
    event ApprovedTokenRemoved(address indexed token);

    // =================================================================
    //                              MODIFIERS
    // =================================================================
    
    // NEW: Access control modifier for Owner or Manager
    modifier onlyOwnerOrManager() {
        require(owner() == msg.sender || isManager[msg.sender], "Caller is not the owner or a manager");
        _;
    }

    // =================================================================
    //                            INITIALIZER & UPGRADE
    // =================================================================

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address _feeRecipient) public initializer {
        __Ownable_init(initialOwner);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
        __Pausable_init();

        // Initial settings
        feeRecipient = _feeRecipient;
        platformFeeBps = 100; // Default to 0.5%
        buyerPaymentTimeout = 15 minutes;
        sellerReleaseTimeout = 15 minutes;

        // Add the owner as the first arbitrator
        isArbitrator[initialOwner] = true;
        _arbitratorList.push(initialOwner);
    }

    // =================================================================
    //                       UPGRADEABILITY
    // =================================================================

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // =================================================================
    //                     ORDER MANAGEMENT (SELLER)
    // =================================================================

    function createAndFundOrder(address _token, uint256 _amount) external nonReentrant {
        require(approvedTokens[_token], "Token not approved");
        require(_amount > 0, "Amount must be positive");
        
        _orderCounter++;
        uint256 orderId = _orderCounter;

        uint256 fee = (_amount * platformFeeBps) / 10000;
        uint256 totalDeposit = _amount + fee;

        IERC20 token = IERC20(_token);
        
        // 1. Pull the total amount (principal + fee) from the seller
        require(token.transferFrom(msg.sender, address(this), totalDeposit), "Token transfer failed");

        // 2. NEW: Immediately transfer the fee portion to the fee recipient
        require(token.transfer(feeRecipient, fee), "Fee transfer failed");

        // 3. The principal amount remains in the contract for the order
        orders[orderId] = Order({
            id: orderId,
            seller: msg.sender,
            token: _token,
            totalAmount: _amount,
            remainingAmount: _amount,
            status: OrderStatus.OPEN
        });

        emit OrderCreated(orderId, msg.sender, _token, _amount);
    }

    function createNativeOrder(uint256 _amount) external payable nonReentrant {
        require(_amount > 0, "Amount must be positive");
        
        uint256 platformFee = (_amount * platformFeeBps) / 10000;
        require(msg.value == _amount + platformFee, "Incorrect ETH value sent");

      
        (bool sent, ) = feeRecipient.call{value: platformFee}("");
        require(sent, "Failed to send fee");

        _orderCounter++;
        uint256 orderId = _orderCounter;

        // The principal amount remains in the contract for the order
        orders[orderId] = Order({
            id: orderId,
            seller: msg.sender,
            token: address(0), 
            totalAmount: _amount,
            remainingAmount: _amount,
            status: OrderStatus.OPEN
        });

        emit OrderCreated(orderId, msg.sender, address(0), _amount);
    }

    function cancelOrder(uint256 _orderId) external nonReentrant {
        Order storage order = orders[_orderId];

        require(order.seller == msg.sender, "Not your order");
        require(order.status == OrderStatus.OPEN, "Order not open");
        require(order.remainingAmount > 0, "No amount left to cancel");

        order.status = OrderStatus.CANCELED;
        uint256 refundAmount = order.remainingAmount;
        order.remainingAmount = 0;

        // The fee was already taken at creation. We only refund the remaining principal amount.
        if (order.token == address(0)) {
            // Native ETH refund
            (bool sent, ) = order.seller.call{value: refundAmount}("");
            require(sent, "Native refund failed");
        } else {
            // ERC20 token refund
            IERC20 token = IERC20(order.token);
            require(token.transfer(order.seller, refundAmount), "ERC20 refund failed");
        }

        emit OrderCanceled(_orderId);
    }
    
    // =================================================================
    //                       TRADE MANAGEMENT (BUYER)
    // =================================================================

    function lockTrade(uint256 _orderId, uint256 _amount) external whenNotPaused {
        Order storage order = orders[_orderId];
        require(order.status == OrderStatus.OPEN, "Order not open");
        require(_amount > 0 && _amount <= order.remainingAmount, "Invalid amount");

        order.remainingAmount -= _amount;
        if (order.remainingAmount == 0) {
            order.status = OrderStatus.CLOSED;
        }

        _tradeCounter++;
        uint256 tradeId = _tradeCounter;

        trades[tradeId] = Trade({
            id: tradeId,
            orderId: _orderId,
            buyer: msg.sender,
            amount: _amount,
            status: TradeStatus.LOCKED,
            lockedAt: block.timestamp,
            fiatSentAt: 0
        });

        emit TradeCreated(tradeId, _orderId, msg.sender, _amount);
    }

    function lockMultipleTrades(uint256[] calldata _orderIds, uint256[] calldata _amounts) external nonReentrant whenNotPaused {
        require(_orderIds.length == _amounts.length, "Input arrays must have the same length");
        require(_orderIds.length > 0, "Must provide at least one order to lock");

        for (uint i = 0; i < _orderIds.length; i++) {
            uint256 orderId = _orderIds[i];
            uint256 amount = _amounts[i];
            
            Order storage order = orders[orderId];
            require(order.status == OrderStatus.OPEN, "Order not open");
            require(amount > 0 && amount <= order.remainingAmount, "Invalid amount for one of the orders");

            order.remainingAmount -= amount;
            if (order.remainingAmount == 0) {
                order.status = OrderStatus.CLOSED;
            }

            _tradeCounter++;
            uint256 tradeId = _tradeCounter;
            trades[tradeId] = Trade({
                id: tradeId,
                orderId: orderId,
                buyer: msg.sender,
                amount: amount,
                status: TradeStatus.LOCKED,
                lockedAt: block.timestamp,
                fiatSentAt: 0
            });
            emit TradeCreated(tradeId, orderId, msg.sender, amount);
        }
    }

    // =================================================================
    //                     TRADE LIFECYCLE
    // =================================================================

    function confirmFiatSent(uint256 _tradeId) external whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.buyer == msg.sender, "Not your trade");
        require(trade.status == TradeStatus.LOCKED, "Trade not locked");
        require(block.timestamp <= trade.lockedAt + buyerPaymentTimeout, "Payment timed out");

        trade.status = TradeStatus.FIAT_SENT;
        trade.fiatSentAt = block.timestamp;
        emit FiatSent(_tradeId);
    }

    function releaseFundsForTrade(uint256 _tradeId) external nonReentrant {
        Trade storage trade = trades[_tradeId];
        Order storage order = orders[trade.orderId];

        require(order.seller == msg.sender, "Not your order to release");
        require(trade.status == TradeStatus.FIAT_SENT, "Fiat payment not confirmed");

        trade.status = TradeStatus.RELEASED;
        
        // The fee is handled at order creation. We only transfer the trade amount.
        if (order.token == address(0)) {
            // Native ETH release
            (bool success, ) = trade.buyer.call{value: trade.amount}("");
            require(success, "Failed to send ETH to buyer");
        } else {
            // ERC20 release
            IERC20 token = IERC20(order.token);
            require(token.transfer(trade.buyer, trade.amount), "ERC20 transfer to buyer failed");
        }

        emit TradeReleased(_tradeId);
    }

    // =================================================================
    //                     DISPUTES & CANCELLATIONS
    // =================================================================
    
    function cancelLockedTradeByBuyer(uint256 _tradeId) external whenNotPaused {
        Trade storage trade = trades[_tradeId];
        require(trade.buyer == msg.sender, "Not your trade");
        require(trade.status == TradeStatus.LOCKED, "Can only cancel a locked trade");

        trade.status = TradeStatus.CANCELED;
        
        Order storage order = orders[trade.orderId];
        order.remainingAmount += trade.amount;
        if (order.status == OrderStatus.CLOSED) {
            order.status = OrderStatus.OPEN;
        }
        
        emit TradeCanceled(_tradeId);
    }
    
    function raiseDispute(uint256 _tradeId) external whenNotPaused {
        Trade storage trade = trades[_tradeId];
        Order storage order = orders[trade.orderId];
        require(trade.buyer == msg.sender || order.seller == msg.sender, "Not involved in this trade");
        require(trade.status == TradeStatus.FIAT_SENT, "Can only dispute after fiat is sent");
        
        trade.status = TradeStatus.DISPUTED;
        emit DisputeRaised(_tradeId);
    }
    
    function resolveDispute(uint256 _tradeId, address _winner) external nonReentrant {
        require(isArbitrator[msg.sender], "Not an arbitrator");
        
        Trade storage trade = trades[_tradeId];
        Order storage order = orders[trade.orderId];
        
        require(trade.status == TradeStatus.DISPUTED, "Trade not in dispute");
        require(_winner == trade.buyer || _winner == order.seller, "Invalid winner");

        trade.status = TradeStatus.RELEASED; 
        
        // The fee is handled at order creation. We only transfer the disputed amount.
        if (order.token == address(0)) {
            // Native ETH release to winner
            (bool success, ) = _winner.call{value: trade.amount}("");
            require(success, "Failed to send ETH to winner");
        } else {
            // ERC20 release to winner
            IERC20 token = IERC20(order.token);
            require(token.transfer(_winner, trade.amount), "ERC20 transfer to winner failed");
        }

        emit DisputeResolved(_tradeId, _winner);
    }

    // =================================================================
    //                        OWNER & ADMIN FUNCTIONS
    // =================================================================

    function addManager(address _account) public onlyOwner {
        require(_account != address(0), "Invalid address");
        require(!isManager[_account], "Account is already a manager");
        isManager[_account] = true;
        _managerList.push(_account);
    }

    function removeManager(address _account) public onlyOwner {
        require(isManager[_account], "Account is not a manager");
        isManager[_account] = false;
        
        for (uint i = 0; i < _managerList.length; i++) {
            if (_managerList[i] == _account) {
                _managerList[i] = _managerList[_managerList.length - 1];
                _managerList.pop();
                break;
            }
        }
    }

    // --- MODIFIED: Now usable by Owner or Manager ---
    function addArbitrator(address _newArbitrator) external onlyOwnerOrManager {
        require(!isArbitrator[_newArbitrator], "Already an arbitrator");
        isArbitrator[_newArbitrator] = true;
        _arbitratorList.push(_newArbitrator);
        emit ArbitratorAdded(_newArbitrator);
    }

    function removeArbitrator(address _arbToRemove) external onlyOwnerOrManager {
        require(isArbitrator[_arbToRemove], "Not an arbitrator");
        isArbitrator[_arbToRemove] = false;
        
        for (uint i = 0; i < _arbitratorList.length; i++) {
            if (_arbitratorList[i] == _arbToRemove) {
                _arbitratorList[i] = _arbitratorList[_arbitratorList.length - 1];
                _arbitratorList.pop();
                break;
            }
        }
        
        // Emit the event after successfully removing the arbitrator
        emit ArbitratorRemoved(_arbToRemove);
    }

    function addApprovedToken(address _tokenAddress) external onlyOwnerOrManager {
        require(!approvedTokens[_tokenAddress], "Token already approved");
        approvedTokens[_tokenAddress] = true;
        _approvedTokensList.push(_tokenAddress);

        // Emit the event after successfully adding the token
        emit ApprovedTokenAdded(_tokenAddress);
    }

    function removeApprovedToken(address _tokenAddress) external onlyOwnerOrManager {
        require(approvedTokens[_tokenAddress], "Token not approved");
        approvedTokens[_tokenAddress] = false;
        
        for (uint i = 0; i < _approvedTokensList.length; i++) {
            if (_approvedTokensList[i] == _tokenAddress) {
                _approvedTokensList[i] = _approvedTokensList[_approvedTokensList.length - 1];
                _approvedTokensList.pop();
                break;
            }
        }

        // Emit the event after successfully removing the token
        emit ApprovedTokenRemoved(_tokenAddress);
    }

    function setBuyerPaymentTimeout(uint256 _newTimeoutInSeconds) external onlyOwner {
        require(_newTimeoutInSeconds > 0, "Timeout must be greater than zero");
        buyerPaymentTimeout = _newTimeoutInSeconds;
        emit BuyerPaymentTimeoutUpdated(_newTimeoutInSeconds);
    }

    function setSellerReleaseTimeout(uint256 _newTimeoutInSeconds) external onlyOwner {
        require(_newTimeoutInSeconds > 0, "Timeout must be greater than zero");
        sellerReleaseTimeout = _newTimeoutInSeconds;
        emit SellerReleaseTimeoutUpdated(_newTimeoutInSeconds);
    }

    function setPlatformFeeBps(uint256 _newFeeBps) external onlyOwner {
        platformFeeBps = _newFeeBps;
    }

    function setFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid address");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }

    function pause() public onlyOwner { _pause(); }
    function unpause() public onlyOwner { _unpause(); }
    
    // =================================================================
    //                              GETTERS
    // =================================================================

    function getArbitrators() external view returns (address[] memory) {
        return _arbitratorList;
    }

    function getApprovedTokens() external view returns (address[] memory) {
        return _approvedTokensList;
    }

    function getManagers() external view returns (address[] memory) {
        return _managerList;
    }
}