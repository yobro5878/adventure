// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.6;

import "./legacy/Card.sol";
import "./interface/IAdventureCards.sol";

/** 
 * @dev A contract the matches the Adventure Cards contract
 * on mainnet, but forbids several admin methods that
 * do not have a meaning. The contract allows a privileged
 * role of snapshot to mint packs to addresses.
 */
contract Pack is Card {

  // A mapping of privileged snapshot accounts
  // A mapping is used to provide flexibility for future extensions
  mapping (address => bool) public snapshot;

  // A mapping that marks cards as issued by the snapshot
  mapping (uint256 => bool) public issued;

  // A reference to individual Adventure Cards ERC1155
  address public adventureCards;

  // An event emitted when snapshot roles change
  event SnapshotSet(address indexed who, bool value);

  // An event emitted when the reference to adventure cards changes
  event AdventureCardsSet(address indexed _adventureCards);

  // An event emitted when a pack is unbundled
  event Unbundled(address indexed who, uint256 tokenId);

  /**
   * @dev Methods with this modifier can be called only by snapshot accounts
   */
  modifier onlySnapshot() {
    require(snapshot[msg.sender], "Sender is not a snapshot");
    _;
  }

  /**
   * @dev Deprecated, has no meaning
   */
  function mintPublic() public override {
    revert("Not here");
  }

  /**
   * @dev Deprecated, has no meaning
   */
  function setPublicMax(uint256 _publicMax) public override onlyOwner {
    revert("Not here");
  }

  /**
   * @dev Deprecated, has no meaning
   */
  function ownerClaim(uint256 tokenId) public override onlyOwner {
    revert("Not here");
  }

  /**
   * @dev Mints packs to the recipient based on a snapshot, and marks the packs
   * as minted (thus can be called only once on each pack).
   * 
   * @param recipient The account to receive the pack 
   * @param tokenId The ID of the pack
   */
  function snapshotMint(address recipient, uint256 tokenId) external onlySnapshot {
    require(!_exists(tokenId), "Pack already exists");
    require(!issued[tokenId], "Pack was issued sometimes in the past");

    // _safeMint is avoided to be able to match the snapshot exactly
    _mint(recipient, tokenId);
    issued[tokenId] = true;
  }

  /**
   * @dev Unbundles the pack into individual cards. Only the pack owner can
   * call this method. Burns the pack after unbundling.
   *
   * @param tokenId The ID of the pack to be unbundled
   */
  function unbundle(uint256 tokenId) external {
    require(ownerOf(tokenId) == msg.sender, "Only owner can unbundle");

    // unbundle individual cards  
    for (uint256 i = 0; i < 45; i++) {
      string memory card = getCardTitle(tokenId, i);
      IAdventureCards(adventureCards).unbundleMint(msg.sender, card);
    }

    // burn the pack
    _burn(tokenId);

    // indicate unbundling
    emit Unbundled(msg.sender, tokenId);
  }

  /**
   * @dev Admin method to assign snapshot role
   *
   * @param _snapshot The account to be modified
   * @param _value true if the role should be added and false otherwise
   */
  function setSnapshot(address _snapshot, bool _value) external onlyOwner {
    snapshot[_snapshot] = _value;
    emit SnapshotSet(_snapshot, _value);
  }
  
  /**
   * @dev Admin method to set the reference to the ERC1155 Adventure Cards
   *
   * @param _adventureCards The contract address to be set in 
   */
  function setAdventureCards(address _adventureCards) external onlyOwner {
    adventureCards = _adventureCards;
    emit AdventureCardsSet(adventureCards);
  }
}
