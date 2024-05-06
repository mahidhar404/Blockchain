// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.7.0/contracts/security/ReentrancyGuard.sol";

contract Marketplace is ReentrancyGuard {
    
    struct Item {
        uint item_id;
        address payable seller_address;
        string item_name;
        string item_description;
        uint price;  // Price is directly handled as Ether in input/output
        bool sold;
        bool exists;
    }

    uint public itemCount = 0;
    mapping(uint => Item) public items;

    event ItemListed(uint indexed item_id, address indexed seller_address, string item_name, string item_description, uint price);
    event ItemSold(uint indexed item_id, address indexed buyer, uint price);

    function listItem(string memory _item_name, string memory _item_description, uint _price) public {
        require(_price > 0, "Price must be greater than zero");
        uint newItemId = itemCount;
        items[newItemId] = Item(newItemId, payable(msg.sender), _item_name, _item_description, _price, false, true);
        itemCount++;
        emit ItemListed(newItemId, msg.sender, _item_name, _item_description, _price);
    }

    function buyItem(uint _item_id) public payable nonReentrant {
        Item storage item = items[_item_id];
        require(item.exists, "Item must exist");
        require(msg.value == item.price, "Please send the exact price in Ether");
        require(!item.sold, "Item already sold");
        require(item.seller_address != msg.sender, "Seller cannot buy their own item");

        item.seller_address.transfer(msg.value);
        item.sold = true;
        emit ItemSold(_item_id, msg.sender, item.price);
    }
}
