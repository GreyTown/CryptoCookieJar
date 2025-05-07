// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CryptoCookieJar {
    struct Deposit {
        uint256 amount;
        uint256 lockTime;
        uint256 rewardRate;
        bool claimed;
    }
    
    mapping(address => Deposit) public deposits;
    uint256 public constant MIN_LOCK_TIME = 1 days;
    uint256 public constant MAX_LOCK_TIME = 30 days;
    uint256 public constant BASE_REWARD = 5; // 5% base reward
    uint256 public constant EARLY_WITHDRAWAL_PENALTY = 10; // 10% penalty
    
    event CookiesDeposited(address indexed user, uint256 amount, uint256 lockTime);
    event CookiesWithdrawn(address indexed user, uint256 amount, uint256 rewardOrPenalty);
    
    function depositCookies(uint256 lockTime) external payable {
        require(msg.value > 0, "Need to send some cookies!");
        require(lockTime >= MIN_LOCK_TIME && lockTime <= MAX_LOCK_TIME, "Invalid lock time");
        require(deposits[msg.sender].amount == 0, "Already have cookies in jar");
        
        // Calculate reward rate based on lock time (longer lock = higher reward)
        uint256 rewardRate = BASE_REWARD + (lockTime / 1 days);
        
        deposits[msg.sender] = Deposit({
            amount: msg.value,
            lockTime: block.timestamp + lockTime,
            rewardRate: rewardRate,
            claimed: false
        });
        
        emit CookiesDeposited(msg.sender, msg.value, lockTime);
    }
    
    function withdrawCookies() external {
        Deposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.amount > 0, "No cookies in jar");
        require(!userDeposit.claimed, "Already claimed");
        
        uint256 amount = userDeposit.amount;
        uint256 finalAmount;
        string memory message;
        
        if (block.timestamp >= userDeposit.lockTime) {
            // Calculate reward
            uint256 reward = (amount * userDeposit.rewardRate) / 100;
            finalAmount = amount + reward;
            message = "Enjoy your cookies with reward!";
        } else {
            // Apply penalty
            uint256 penalty = (amount * EARLY_WITHDRAWAL_PENALTY) / 100;
            finalAmount = amount - penalty;
            message = "Early withdrawal penalty applied!";
        }
        
        userDeposit.claimed = true;
        payable(msg.sender).transfer(finalAmount);
        
        emit CookiesWithdrawn(msg.sender, finalAmount, 
            block.timestamp >= userDeposit.lockTime ? userDeposit.rewardRate : EARLY_WITHDRAWAL_PENALTY);
    }
    
    function peekInJar() external view returns (uint256 amount, uint256 unlockTime, uint256 rewardRate) {
        Deposit memory userDeposit = deposits[msg.sender];
        return (userDeposit.amount, userDeposit.lockTime, userDeposit.rewardRate);
    }
}