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
const Snapshot = artifacts.require("Snapshot");

describe("Snapshot minting test", async function () {
  let packs;
  let accounts;
  let owner;
  let recipients;
  let pack;
  let snapshot;

  beforeEach(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    recipients = [accounts[1], accounts[1], accounts[2], accounts[2]];
    packs = ["0", "1", "2", "3"];
    pack = await Pack.new({ from: owner });
    snapshot = await Snapshot.new({ from: owner });
  });

  it("Owner is set and can be changed, only happy paths", async function () {
    assert.equal(await snapshot.owner(), owner);
    const newOwner = accounts[2];
    await snapshot.transferOwnership(newOwner, { from: owner });
    assert.equal(await snapshot.owner(), newOwner);
    await snapshot.renounceOwnership({ from: newOwner });
    assert.equal(await snapshot.owner(), constants.ZERO_ADDRESS);
  });

  it("Methods are protected", async function () {
    await expectRevert(
      snapshot.setOwners([], [], { from: accounts[2] }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      snapshot.mint(0, 0, { from: accounts[2] }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      snapshot.freeze({ from: accounts[2] }),
      "Ownable: caller is not the owner"
    );
    await expectRevert(
      snapshot.setPack(pack.address, { from: accounts[2] }),
      "Ownable: caller is not the owner"
    );
  });

  it("Happy path with freezeing checks", async function () {
    await snapshot.setPack(pack.address, { from: owner });
    await pack.setSnapshot(snapshot.address, true, { from: owner });

    // set owners
    await snapshot.setOwners(recipients, packs, { from: owner });
    for (let i = 0; i < recipients.length; i++) {
      assert.equal(await snapshot.owners(packs[i]), recipients[i]);
    }

    // set again to check no-fail
    await snapshot.setOwners(recipients, packs, { from: owner });
    assert.equal(await snapshot.totalSet(), 4);
    assert.equal(await snapshot.totalMinted(), 0);

    // no premature mint
    await expectRevert(
      snapshot.mint(0, 4, { from: owner }),
      "Freeze loading cards first"
    );

    // freeze
    await snapshot.freeze({ from: owner });

    // not more setting
    await expectRevert(
      snapshot.setOwners(recipients, packs, { from: owner }),
      "Loading cards has been frozen"
    );

    // now mint in two steps
    await snapshot.mint(0, 1, { from: owner });
    assert.equal(await snapshot.totalSet(), 4);
    assert.equal(await snapshot.totalMinted(), 1);
    await snapshot.mint(1, 4, { from: owner });
    assert.equal(await snapshot.totalSet(), 4);
    assert.equal(await snapshot.totalMinted(), 4);

    // check recipients
    for (let i = 0; i < recipients.length; i++) {
      assert.equal(await pack.ownerOf(packs[i]), recipients[i]);
    }

    // no unset mints
    await expectRevert(
      snapshot.mint(5, 6, { from: owner }),
      "Owner is not set"
    );

    // no repeat mint actions
    await expectRevert(snapshot.mint(0, 4, { from: owner }), "Already minted");

    // no more actions
    await expectRevert(
      snapshot.freeze({ from: owner }),
      "The snapshot has been frozen forever"
    );
    await expectRevert(
      snapshot.setPack(pack.address, { from: owner }),
      "The snapshot has been frozen forever"
    );
  });
});
