// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.6;

interface IAdventureCards {

  function unbundleMint(address recipient, string calldata card) external;

}
