// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.6;

import "./Pack.sol";

/**
 * @dev A contract to load the snapshot data into. After loading
 * the data, the contract will be forever frozen and the minting can
 * be triggered. This is for added convenience, safety, and auditability.
 */
contract Snapshot is Ownable {

  // The mapping of owners of individual packs as per mainnet
  mapping (uint256 => address) public owners;

  // The mapping of packs showing if they were minted
  mapping (uint256 => bool) public minted;

  // The total number of packs with set owners
  uint256 public totalSet;

  // The total number of minted packs so far
  uint256 public totalMinted;

  // The flag showing if the state of pack owners is frozen
  bool public frozen;

  // The reference to the pack ERC721 contract
  address public pack;

  // An event emitted when the contract is frozen
  event Frozen();

  // An event emitted when the packs are dropped
  event Minted(uint256 from, uint256 to);

  // An event emitted when the pack is set
  event PackSet(address _pack);
 
  constructor() {}

  /**
   * @dev Privileged method that records a batch of card owners.
   *
   * @param _owners An array of pack owners
   * @param _packs An array of pack IDs matching the owners
   */ 
  function setOwners(address[] calldata _owners, uint256[] calldata _packs) external onlyOwner {
    require(!frozen, "Loading cards has been frozen");
    require(_owners.length == _packs.length, "length mismatch");

    for (uint256 i = 0; i < _owners.length; i++) {
      if (owners[_packs[i]] != address(0)) {
        totalSet -= 1;
      }
      owners[_packs[i]] = _owners[i];
    }

    totalSet += _packs.length;
  }


  /**
   * @dev Mints packs to the owners after this contract as been frozen.
   *
   * @param from The pack ID to start from, inclusive
   * @param from The pack ID to end at, exclusive
   */
  function mint(uint256 from, uint256 to) external onlyOwner {
    require(frozen, "Freeze loading cards first");

    for (uint256 i = from; i < to; i++) {
      require(!minted[i], "Already minted");
      require(owners[i] != address(0), "Owner is not set");

      Pack(pack).snapshotMint(owners[i], i);
      minted[i] = true;
      totalMinted += 1;
    }

    emit Minted(from, to);
  }

  /**
   * @dev An admin method to freeze recording of the owners forever
   */
  function freeze() external onlyOwner {
    require(!frozen, "The snapshot has been frozen forever");

    frozen = true;
    emit Frozen();
  }

  /**
   * @dev An admin method to set the reference to the pack contract
   *
   * @param _pack The address of the pack contract
   */
  function setPack(address _pack) external onlyOwner {
    require(!frozen, "The snapshot has been frozen forever");

    pack = _pack;
    emit PackSet(_pack);
  }
}

