let web3;
let contract;
let accounts;

const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
const contractABI = [/* Paste your contract ABI here */];

document.addEventListener('DOMContentLoaded', () => {
    const connectWalletBtn = document.getElementById('connectWalletBtn');
    const depositBtn = document.getElementById('depositBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    
    // Initialize Web3
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        initializeApp();
    } else {
        alert("Please install MetaMask to use this DApp!");
    }
    
    // Connect Wallet Button
    connectWalletBtn.addEventListener('click', async () => {
        try {
            accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            document.getElementById('walletAddress').textContent = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
            updateJarInfo();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    });
    
    // Deposit Button
    depositBtn.addEventListener('click', async () => {
        if (!accounts) {
            alert("Please connect your wallet first");
            return;
        }
        
        const ethAmount = document.getElementById('ethAmount').value;
        const lockTimeDays = document.getElementById('lockTime').value;
        
        if (!ethAmount || isNaN(ethAmount) || parseFloat(ethAmount) <= 0) {
            alert("Please enter a valid ETH amount");
            return;
        }
        
        try {
            const weiAmount = web3.utils.toWei(ethAmount, 'ether');
            const lockTimeSeconds = lockTimeDays * 24 * 60 * 60;
            
            await contract.methods.depositCookies(lockTimeSeconds).send({
                from: accounts[0],
                value: weiAmount
            });
            
            alert("Cookies successfully deposited in the jar!");
            updateJarInfo();
        } catch (error) {
            console.error("Deposit error:", error);
            alert("Error depositing cookies: " + error.message);
        }
    });
    
    // Withdraw Button
    withdrawBtn.addEventListener('click', async () => {
        if (!accounts) {
            alert("Please connect your wallet first");
            return;
        }
        
        try {
            await contract.methods.withdrawCookies().send({
                from: accounts[0]
            });
            
            document.getElementById('withdrawMessage').textContent = "Cookies withdrawn successfully!";
            updateJarInfo();
        } catch (error) {
            console.error("Withdraw error:", error);
            document.getElementById('withdrawMessage').textContent = "Withdraw error: " + error.message;
        }
    });
});

async function initializeApp() {
    contract = new web3.eth.Contract(contractABI, contractAddress);
    
    // Check if wallet is already connected
    accounts = await web3.eth.getAccounts();
    if (accounts.length > 0) {
        document.getElementById('walletAddress').textContent = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
        updateJarInfo();
    }
}

async function updateJarInfo() {
    if (!accounts || accounts.length === 0) return;
    
    try {
        const jarInfo = await contract.methods.peekInJar().call({ from: accounts[0] });
        const jarDisplay = document.getElementById('jarInfo');
        
        if (jarInfo.amount > 0) {
            const ethAmount = web3.utils.fromWei(jarInfo.amount, 'ether');
            const unlockDate = new Date(jarInfo.unlockTime * 1000);
            const now = new Date();
            
            const timeLeft = jarInfo.unlockTime > Math.floor(now.getTime() / 1000) 
                ? `Unlocks in ${Math.ceil((jarInfo.unlockTime - Math.floor(now.getTime() / 1000)) / (24 * 60 * 60))} days`
                : "Ready to withdraw!";
            
            jarDisplay.innerHTML = `
                <p>🍪 Cookies in jar: ${ethAmount} ETH</p>
                <p>🔒 ${timeLeft}</p>
                <p>🎁 Potential reward: ${jarInfo.rewardRate}%</p>
            `;
        } else {
            jarDisplay.innerHTML = "<p>No cookies in the jar yet!</p>";
        }
    } catch (error) {
        console.error("Error fetching jar info:", error);
    }
}

// Listen for account changes
window.ethereum.on('accountsChanged', (newAccounts) => {
    accounts = newAccounts;
    if (accounts.length > 0) {
        document.getElementById('walletAddress').textContent = `Connected: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
        updateJarInfo();
    } else {
        document.getElementById('walletAddress').textContent = "Not connected";
        document.getElementById('jarInfo').innerHTML = "<p>No cookies in the jar yet!</p>";
    }
});