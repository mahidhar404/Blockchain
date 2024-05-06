const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
let contract;
let userAccount;

async function startApp() {
    const contractAddress = '0xdBe640E869Fd42103cd355270004e9eCB22578a8';
    const contractABI = [
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "_item_id",
                    "type": "uint256"
                }
            ],
            "name": "buyItem",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "item_id",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "seller_address",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "item_name",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "item_description",
                    "type": "string"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "name": "ItemListed",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "uint256",
                    "name": "item_id",
                    "type": "uint256"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "buyer",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                }
            ],
            "name": "ItemSold",
            "type": "event"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_item_name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "_item_description",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "_price",
                    "type": "uint256"
                }
            ],
            "name": "listItem",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "itemCount",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "items",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "item_id",
                    "type": "uint256"
                },
                {
                    "internalType": "address payable",
                    "name": "seller_address",
                    "type": "address"
                },
                {
                    "internalType": "string",
                    "name": "item_name",
                    "type": "string"
                },
                {
                    "internalType": "string",
                    "name": "item_description",
                    "type": "string"
                },
                {
                    "internalType": "uint256",
                    "name": "price",
                    "type": "uint256"
                },
                {
                    "internalType": "bool",
                    "name": "sold",
                    "type": "bool"
                },
                {
                    "internalType": "bool",
                    "name": "exists",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    if (typeof web3 !== 'undefined') {
        contract = new web3.eth.Contract(contractABI, contractAddress);
        document.getElementById('connectWallet').onclick = connectWallet;
        document.getElementById('listItemButton').onclick = listItem;
        document.getElementById('buyItemButton').onclick = buyItem;
        document.getElementById('showAvailableItemsButton').onclick = renderItems;
        document.getElementById('showSoldItemsButton').onclick = renderSoldItems;
        await connectWallet();
        await renderItems();
    } else {
        console.error('Web3 not found. Please install and/or enable MetaMask.');
        alert('Web3 not found. Please install and/or enable MetaMask.');
    }
}

async function connectWallet() {
    try {
        const accounts = await web3.eth.requestAccounts();
        if (accounts.length === 0) {
            alert('No Ethereum accounts detected. Please check your wallet.');
            return;
        }
        userAccount = accounts[0];
        document.getElementById('connectWallet').innerText = `Wallet Connected: ${userAccount.substring(0, 6)}...${userAccount.substring(38)}`;
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Failed to connect wallet. Please ensure MetaMask is installed and you are logged in.');
    }
}

async function listItem() {
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    let price = document.getElementById('price').value.trim(); // Trim any leading/trailing whitespace

    // Log the price before conversion
    console.log("Price before conversion:", price);

    // Validate the price input
    if (!price || isNaN(price)) {
        alert("Please enter a valid price.");
        return;
    }

    // Convert input price to Wei if it's in Ether (assuming 1 Ether = 1e18 Wei)
    if (price.includes('Ether')) {
        const etherValue = parseFloat(price);
        if (!isNaN(etherValue)) {
            price = web3.utils.toWei(etherValue.toString(), 'ether');
        } else {
            alert("Please enter a valid price.");
            return;
        }
    }

    try {
        const response = await contract.methods.listItem(title, description, price).send({from: userAccount});
        console.log("Transaction hash for listing item:", response.transactionHash);
        localStorage.setItem('listHash_' + response.events.ItemListed.returnValues.item_id, response.transactionHash);
        alert("Item listed successfully! Transaction hash: " + response.transactionHash);
        await renderItems();
    } catch (error) {
        console.error("Failed to list item:", error);
        alert("Failed to list item, please try again.");
    }
}


async function buyItem() {
    const id = document.getElementById('itemIdToBuy').value.trim();
    if (!id || isNaN(id)) {
        alert("Please enter a valid item ID.");
        return;
    }
    try {
        const item = await contract.methods.items(id).call();
        if (!item.exists || item.sold) {
            alert("This item does not exist or has already been sold.");
            return;
        }
        const response = await contract.methods.buyItem(id).send({ from: userAccount, value: item.price });
        alert("Purchase successful! Transaction hash: " + response.transactionHash);
        await renderItems();
        await renderSoldItems();
    } catch (error) {
        console.error("Failed to buy item:", error);
        alert("Operation failed, please try again.");
    }
}

async function renderItems() {
    const itemCount = await contract.methods.itemCount().call();
    const itemsList = document.getElementById('itemsList');
    itemsList.innerHTML = '';
    for (let i = 0; i < itemCount; i++) {
        const item = await contract.methods.items(i).call();
        const priceInEther = web3.utils.fromWei(item.price, 'ether'); // Convert price from wei to ether
        const listItem = document.createElement('li');
        listItem.className = 'item-entry';
        listItem.innerHTML = `
            <div class="item-info">
                <strong>ID:</strong> ${item.item_id} <br>
                <strong>Title:</strong> ${item.item_name} <br>
                <strong>Price:</strong> ${priceInEther} Ether <br>
                <strong>Sold:</strong> ${item.sold ? 'Yes' : 'No'}
            </div>
        `;
        itemsList.appendChild(listItem);
    }
}

async function renderSoldItems() {
    const soldItemsList = document.getElementById('soldItemsList');
    soldItemsList.innerHTML = '';
    let itemCount = await contract.methods.itemCount().call();

    for (let i = 0; i < itemCount; i++) {
        const item = await contract.methods.items(i).call();
        if (item.exists && item.sold) {
            // Convert price from wei to ether
            const priceInEther = web3.utils.fromWei(item.price, 'ether');
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <strong>ID:</strong> ${item.item_id} <br>
                <strong>Title:</strong> ${item.item_name} <br>
                <strong>Description:</strong> ${item.item_description} <br>
                <strong>Price:</strong> ${priceInEther} Ether <br>
                <strong>Sold:</strong> Yes
            `;
            soldItemsList.appendChild(listItem);
        }
    }
}

window.addEventListener('load', startApp);
