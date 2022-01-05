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
const AdventureCards = artifacts.require("AdventureCards");

describe("Unit Functionality Test", async function () {
  let accounts;
  let owner;
  let snapshot;
  let recipient;
  let adventureCards;

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    snapshot = accounts[1];
    recipient = accounts[3];
    adventureCards = await AdventureCards.new({ from: owner });
    await adventureCards.setMinter(snapshot, true, { from: owner });
  });

  it("Privileged methods", async function () {
    assert.equal(await adventureCards.owner(), owner);
    await expectRevert(
      adventureCards.setMinter(owner, true, { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      adventureCards.unbundleMint(owner, "Card", { from: owner }),
      "Sender is not a minter"
    );
    await expectRevert(
      adventureCards.setBaseUri("", { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      adventureCards.setCard("blah", "blah", { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      adventureCards.removeCard("blah", { from: snapshot }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      adventureCards.setSemantics(snapshot, { from: snapshot }),
      "Ownable: caller is not the owner"
    );
  });

  it("Adding and removing cards", async function () {
    await adventureCards.setCard("ORC", "custom uri");
    assert.equal(await adventureCards.uri(1), "custom uri");
    await adventureCards.unbundleMint(owner, "ORC", { from: snapshot });
    await adventureCards.unbundleMint(owner, "ORC", { from: snapshot });
    await adventureCards.unbundleMint(owner, "ORC", { from: snapshot });
    assert.equal(await adventureCards.totalSupply(1), 3);
    assert.equal(await adventureCards.balanceOf(owner, 1), 3);
    await adventureCards.setCard("ORC", "", { from: owner });
    assert.equal(
      await adventureCards.uri(1),
      "https://0xadventure.com/unbundled/{id}.json"
    );
    await adventureCards.burn(owner, 1, 1, { from: owner });
    await adventureCards.burn(owner, 1, 1, { from: owner });
    assert.equal(await adventureCards.totalSupply(1), 1);
    assert.equal(await adventureCards.balanceOf(owner, 1), 1);
    await expectRevert(
      adventureCards.removeCard("ORC", { from: owner }),
      "This card is in circulation"
    );
    await adventureCards.burn(owner, 1, 1, { from: owner });
    assert.equal(await adventureCards.totalSupply(1), 0);
    assert.equal(await adventureCards.balanceOf(owner, 1), 0);
    await adventureCards.removeCard("ORC", { from: owner });
    assert.equal(await adventureCards.totalSupply(1), 0);
    assert.equal(await adventureCards.balanceOf(owner, 1), 0);
  });

  it("URI checks", async function () {
    await adventureCards.setCard("ORC", "");
    assert.equal(
      await adventureCards.uri(1),
      "https://0xadventure.com/unbundled/{id}.json"
    );
    await adventureCards.setBaseUri("blah");
    assert.equal(await adventureCards.uri(1), "blah");
    await adventureCards.setCard("ORC", "else");
    assert.equal(await adventureCards.uri(1), "else");
  });
});

describe("Unbundle Test", async function () {
  let pack;
  let accounts;
  let owner;
  let snapshot;
  let recipient;
  let adventureCards;

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    snapshot = accounts[1];
    recipient = accounts[3];
    pack = await Pack.new({ from: owner });
    await pack.setSnapshot(snapshot, true, { from: owner });
    adventureCards = await AdventureCards.new({ from: owner });
  });

  it("Happy unbundle path", async function () {
    const contents = [
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
    let cardId = "17";
    await pack.snapshotMint(recipient, cardId, { from: snapshot });

    // set adventure cards contract
    await pack.setAdventureCards(adventureCards.address, { from: owner });
    await adventureCards.setMinter(pack.address, true, { from: owner });

    // set cards
    let balance = {};
    for (let i = 0; i < contents.length; i++) {
      await adventureCards.setCard(contents[i], "", { from: owner });
      if (balance[contents[i]] == undefined) {
        balance[contents[i]] = 0;
      }
      balance[contents[i]]++;
    }

    // unbundle
    await pack.unbundle(cardId, { from: recipient });

    // check that the recipient owns the cards and no pack
    await expectRevert(
      pack.ownerOf(cardId),
      "ERC721: owner query for nonexistent token"
    );

    // check totaly supply and balance
    for (let i = 0; i < contents.length; i++) {
      let cardType = await adventureCards.cardTypes(contents[i]);
      assert.equal(
        await adventureCards.totalSupply(cardType),
        balance[contents[i]]
      );
      assert.equal(
        await adventureCards.balanceOf(recipient, cardType),
        balance[contents[i]]
      );
      assert.isTrue(balance[contents[i]] > 0);
    }
  });
});
