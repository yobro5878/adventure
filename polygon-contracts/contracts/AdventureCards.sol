// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interface/ISemantics.sol";

/**
 * @dev The ERC1155 contract that represents individual Adventure Cards.
 * The tokens to exist are to be defined by the owner. Unbundling
 * is intended to be done via the pack contract.
 */
contract AdventureCards is ERC1155Burnable, ERC1155Supply, Ownable {

  // The mapping of card names to card types
  mapping (string => uint256) public cardTypes;

  // The minter role mapping
  // A mapping is used for the flexibility of future development
  mapping (address => bool) public minters;

  // A mapping of card IDs to individual URIs
  mapping (uint256 => string) public customUris;

  // A counter for setting the IDs of the card types
  uint256 public nextCardType = 1;

  // A reference to the semantics contract
  address public semantics;

  // Emitted when a minter is added or removed
  event MinterSet(address indexed minter, bool value);

  // Emitted when an interpretation contract is set
  event SemanticsSet(address indexed semantics);

  // Emitted when a card type URI is set
  event CardSet(string cardType, uint256 id, string uri);

  // Emitted when a card is removed
  event CardRemoved(string cardType, uint256 id);

  // Emitted when the base URI changes
  event BaseUriSet(string uri);

  /**
   * @dev Methods annotated with this modifier can be called only by the minters.
   */
  modifier onlyMinter() {
    require(minters[msg.sender], "Sender is not a minter");
    _;
  }

  constructor() ERC1155("https://0xadventure.com/unbundled/{id}.json") {
  }

  /**
   * @dev Mints a single card. Privileged to be callable only by the minters.
   * Intended to be used for unbudnling cards. The card needs to exist before
   * it can be unbundled.
   *
   * @param recipient The recipient of the card token
   * @param card The type of the card that the recipient should get
   */
  function unbundleMint(address recipient, string calldata card) public onlyMinter {
    require (cardTypes[card] != 0, "Card does not exist");
    _mint(recipient, cardTypes[card], 1, "");
  }

  /**
   * @dev An override of the uri() method that returns individual card URIs if 
   * they are set
   *
   * @param tokenId The ID of the card to check get the URI for
   * @return The URI of the card metadata
   */
  function uri(uint256 tokenId) public view override returns (string memory) {
    if (bytes(customUris[tokenId]).length > 0) {
      return customUris[tokenId];
    } else {
      return super.uri(tokenId);
    }
  }

  /**
   * @dev A pass-through method for getting semantics for a card. The semantics
   * is returned as bytes and it is up to the client to interpret those.
   * 
   * @param tokenId The ID of the card to check get the semantics for
   * @return The card semantics as bytes
   */
  function getSemantics(uint256 tokenId) public view returns (bytes memory) {
    return ISemantics(semantics).getSemantics(tokenId);
  }

  /**
   * @dev An admin method for setting the new base URI.
   *
   * @param uri_ The URI to be used
   */
  function setBaseUri(string calldata uri_) external onlyOwner {
    _setURI(uri_);
    emit BaseUriSet(uri_);
  }

  /**
   * @dev An admin methods to define a card type and its URI. 
   *
   * @param card The name of the card type
   * @param uri_ The custom URI for this card type
   */
  function setCard(string calldata card, string calldata uri_) external onlyOwner {
    if (cardTypes[card] == 0) {
      cardTypes[card] = nextCardType;
      nextCardType += 1;
    }

    customUris[cardTypes[card]] = uri_;
    emit CardSet(card, cardTypes[card], uri_);
  }

  /**
   * @dev An admin method for removing the card type completely. Only cards with no
   * circulating supply can be removed.
   *
   * @param card The card type to be removed
   */
  function removeCard(string calldata card) external onlyOwner {
    require(totalSupply(cardTypes[card]) == 0, "This card is in circulation");

    emit CardRemoved(card, cardTypes[card]);
    customUris[cardTypes[card]] = "";
    cardTypes[card] = 0;
  }

  function setMinter(address who, bool isMinter) external onlyOwner {
    minters[who] = isMinter;
    emit MinterSet(who, isMinter);
  }

  /**
   * @dev An admin method for setting a contract that interprets cards.
   *
   * @param _semantics The address of the semantics contract
   */
  function setSemantics(address _semantics) external onlyOwner {
    semantics = _semantics;
    emit SemanticsSet(_semantics);
  }

  /**
   * @dev An override for supporting both burning and total supply per card type.
   */
  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) internal virtual override(ERC1155, ERC1155Supply) {
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }
}

