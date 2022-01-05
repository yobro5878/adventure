// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.6;
 
interface ISemantics {
  function getSemantics(uint256 tokenId) external view returns (bytes memory);
}
