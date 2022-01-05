const {
  BN,
  time,
  expectRevert,
  constants,
  balance,
  send,
} = require("@openzeppelin/test-helpers");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");
const { assert, expect } = require("chai");
const { artifacts } = require("hardhat");

const Pack = artifacts.require("Pack");
const AdventureCardsMock = artifacts.require("AdventureCardsMock");

describe("Inheritance matches mainnet", async function () {
  let pack;
  let accounts;
  let owner;

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    pack = await Pack.new({ from: owner });
  });

  it("Owner is set and can be changed, only happy paths", async function () {
    assert.equal(await pack.owner(), owner);
    const newOwner = accounts[2];
    await pack.transferOwnership(newOwner, { from: owner });
    assert.equal(await pack.owner(), newOwner);
    await pack.renounceOwnership({ from: newOwner });
    assert.equal(await pack.owner(), constants.ZERO_ADDRESS);
  });

  it("Methods are forbidden", async function () {
    await expectRevert(pack.mintPublic(), "Not here");
    await expectRevert(pack.setPublicMax(12), "Not here");
    await expectRevert(pack.ownerClaim(2), "Not here");
  });

  it("Same cards and offsets, and works as ERC721 on transfer", async function () {
    const cardId = "17";
    await pack.setSnapshot(owner, true, { from: owner });
    await pack.snapshotMint(owner, cardId);
    // results taken from mainnet
    const results = [
      "Snow Rogue Orc",
      "Light Warrior Griffin",
      "Lightning",
      "Berserker",
      "Haste",
      "Miracle Flight",
      "Frozen Lord Cyclops",
      "Sorrow",
      "Death Queen Elf of the Mountains",
      "Invisibility",
      "Earth Nameless Phoenix of the Shadows",
      "Dark Rogue Griffin",
      "Light Assassin Goblin",
      "Dark Ancient Wizard of Illusion",
      "Firebreath",
      "Skin-Walker",
      "Aura Ancient Wizard of the Light",
      "Fairy",
      "Dark Torment",
      "Assault",
      "Frozen Queen Cyclops",
      "Shield",
      "Eagle",
      "Hypnosis",
      "Lightning",
      "Stricken",
      "Burn",
      "Deathgrip",
      "Irate Lunar Alacrity",
      "Troll",
      "Magi",
      "Fairy",
      "Sigil",
      "Dark Undead Phoenix of Illusion",
      "Deathgrip",
      "Light Undead Cyclops",
      "Pandemonium",
      "Paladin",
      "Frozen Grand Demon of the Void",
      "Gloom Belt",
      "Aura Priest Goblin",
      "Earth Rogue Dwarf of the Low Hills",
      "Shimmering Tempest",
      "Alacrity",
      "Potent Sorrow Shrink",
    ];
    for (let i = 0; i < 45; i++) {
      assert.equal(await pack.getCardTitle(cardId, i), results[i]);
    }
    const recipient = accounts[1];
    await pack.transferFrom(owner, recipient, cardId, { from: owner });
    assert.equal(await pack.ownerOf(cardId), recipient);
  });
});

describe("Pack Drop Test", async function () {
  let pack;
  let accounts;
  let owner;
  let snapshot;

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    snapshot = accounts[1];
    pack = await Pack.new({ from: owner });
    await pack.setSnapshot(snapshot, true, { from: owner });
  });

  it("Should mint and cannot mint twice", async function () {
    let recipient = accounts[3];
    let cardId = "12";
    await pack.snapshotMint(recipient, cardId, { from: snapshot });
    assert.equal(await pack.ownerOf(cardId), recipient);
    assert.isTrue(await pack.issued(cardId));
    await expectRevert(
      pack.snapshotMint(recipient, cardId, { from: snapshot }),
      "Pack already exists"
    );
  });

  it("Minting is privileged", async function () {
    let recipient = accounts[3];
    let cardId = "12";
    await expectRevert(
      pack.snapshotMint(recipient, cardId, { from: owner }),
      "Sender is not a snapshot"
    );
  });

  it("Snapshot setting is privileged and can be removed", async function () {
    let recipient = accounts[3];
    let cardId = "12";
    await expectRevert(
      pack.setSnapshot(recipient, true, { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await pack.setSnapshot(snapshot, false, { from: owner });
    await expectRevert(
      pack.snapshotMint(recipient, cardId, { from: snapshot }),
      "Sender is not a snapshot"
    );
  });

  it("Happy unbundle path, priviliged AC contract setter, packs cannot be re-dropped", async function () {
    let recipient = accounts[3];
    let cardId = "12";
    await pack.snapshotMint(recipient, cardId, { from: snapshot });
    await expectRevert(
      pack.unbundle(cardId, { from: owner }),
      "Only owner can unbundle"
    );

    // set adventure cards mock contract
    const adventureCards = await AdventureCardsMock.new();
    await expectRevert(
      pack.setAdventureCards(adventureCards.address, { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await pack.setAdventureCards(adventureCards.address, { from: owner });

    // unbundle
    await pack.unbundle(cardId, { from: recipient });
    await expectRevert(
      pack.ownerOf(cardId),
      "ERC721: owner query for nonexistent token"
    );
    await expectRevert(
      pack.snapshotMint(recipient, cardId, { from: snapshot }),
      "Pack was issued sometimes in the past"
    );
  });
});
