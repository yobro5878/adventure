### General

The Adventure Cards project has cards packs issued on mainnet and is considering
unbundling them. Unbundling on mainnet would be expensive for the users, therefore
this repository provides mechanisms for unbundling the contracts on the Polygon
network. 

The directory `snapshot` includes a standalone web3 script that scans mainnet
for owners of the individual cards and creates a CSV. A mild modification of
this script would be use to snapshot the pack owners and to create transactions
for the polygon network.

The `polygon-contracts` directory contains smart contracts for issuing the
packs of Adventure Cards on Polygon, and handle further unbundling. The following
sequence of steps should be followed to unbundle the cards:

1. Create a snapshot of owners on mainnet
2. Deploy the contracts on Polygon
3. Drop the packs to owners on Polygon based on the snapshots
4. Configure individual Adventure Cards in the AdventureCards contract
5. The users unbundle the cards themselves

The `Pack.sol` contract is a verbatim copy of `Card.sol` on mainnet
(0x329Fd5E0d9aAd262b13CA07C87d001bec716ED39) with some added functionality
for the drop handling. The implementation is done via inheriting from the
`Card.sol` contract to guarantee the functionality transfer.

The `Snapshot.sol` contract is to be loaded with the snapshot data from
mainnet. When the data is present, it can be frozen and used to replay
the data into the drop on `Pack.sol` purely off-chain (which minimizes the
error opportunity). Push pattern is assumed as transacting on Polygon is
cheap. At this moment, the card packs are re-issued.

The `AdventureCard.sol` contract is a standalone ERC1155 contract that
can be linked with the `Pack.sol` contract. The holders of packs will be
able to burn their packs and will be issued the `AdventureCard.sol` tokens
instead. These tokens represent the individual cards. It is assumed that
the owner of the contract will define the cards from the packs prior to
the unbundling process starting. The contract allows setting individual URLs
with art for each card type in order to support the art that is currently
uploaded to arweave. The contract also provides a hook for card semantics
which can be useful for the future development of the game.

