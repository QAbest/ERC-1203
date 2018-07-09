const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());
const { interface, bytecode} = require('../compile');

let accounts;
let token;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();

  token = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode, arguments: [] })
    .send({ from: accounts[0], gas: '6000000' });

  await token.methods.issue(accounts[1], 600, 0).send({ from: accounts[0], gas: '6000000' });
  await token.methods.issue(accounts[2], 150, 1).send({ from: accounts[0], gas: '6000000' });
  await token.methods.issue(accounts[3], 100, 2).send({ from: accounts[0], gas: '6000000' });
})

describe('Token', () => {
  it('deploys a contract', () => {
    assert.ok(token.options.address);
  });
})


describe('Token', () => {
  it('fully diluted balance is calculated as expect', async () => {
    const diluted1 = await token.methods.fullyDilutedBalanceOf(accounts[1]).call();
    const diluted2 = await token.methods.fullyDilutedBalanceOf(accounts[2]).call();
    const diluted3 = await token.methods.fullyDilutedBalanceOf(accounts[3]).call();
    assert.equal(diluted1, diluted2);
    assert.equal(diluted2, diluted3);
  });
})

describe('Token', () => {
  it('fully diluted total supply is calculated as expect', async () => {
    const fullyDilutedTotalSupply = await token.methods.fullyDilutedTotalSupply().call();
    assert.equal(fullyDilutedTotalSupply, 1800);
  });
})

describe('Token', () => {
  it('can be transfered', async () => {
    await token.methods.transfer(accounts[2], 100).send({ from: accounts[1], gas: '6000000' });
    const balance1 = await token.methods.balanceOf(accounts[1]).call();
    const balance2 = await token.methods.balanceOf(accounts[2]).call();
    assert.equal(balance2 - balance1, -400);
  });
})

describe('Token', () => {
  it('can be transfered by others with approval', async () => {
    await token.methods.approve(accounts[0], 100).send({ from: accounts[1], gas: '6000000' });
    await token.methods.transferFrom(accounts[1], accounts[2], 100).send({ from: accounts[0], gas: '6000000' });
    const balance1 = await token.methods.balanceOf(accounts[1]).call();
    const balance2 = await token.methods.balanceOf(accounts[2]).call();
    assert.equal(balance2 - balance1, -400);
  });
})

describe('Token', () => {
  it('can be transfered (different class)', async () => {
    await token.methods.transfer(accounts[1], 1, 100).send({ from: accounts[2], gas: '6000000' });
    const balance1 = await token.methods.balanceOf(accounts[1], 1).call();
    const balance2 = await token.methods.balanceOf(accounts[2], 1).call();
    assert.equal(balance1, 100);
    assert.equal(balance2, 50);
  });
})

describe('Token', () => {
  it('can be transfered by others with approval (different class)', async () => {
    await token.methods.approve(accounts[0], 1, 100).send({ from: accounts[2], gas: '6000000' });
    await token.methods.transferFrom(accounts[2], accounts[1], 1, 100).send({ from: accounts[0], gas: '6000000' });
    const balance1 = await token.methods.balanceOf(accounts[1], 1).call();
    const balance2 = await token.methods.balanceOf(accounts[2], 1).call();
    assert.equal(balance1, 100);
    assert.equal(balance2, 50);
  });
})

describe('Token', () => {
  it('can be converted', async () => {
    const diluted1 = await token.methods.fullyDilutedBalanceOf(accounts[1]).call();
    const diluted2 = await token.methods.fullyDilutedBalanceOf(accounts[2]).call();
    const diluted3 = await token.methods.fullyDilutedBalanceOf(accounts[3]).call();
    let convertedDiluted1;
    let convertedDiluted2;
    let convertedDiluted3;

    await token.methods.convert(1, 0, 100).send({ from: accounts[2], gas: '6000000' });
    convertedDiluted1 = await token.methods.fullyDilutedBalanceOf(accounts[1]).call();
    convertedDiluted2 = await token.methods.fullyDilutedBalanceOf(accounts[2]).call();
    convertedDiluted3 = await token.methods.fullyDilutedBalanceOf(accounts[3]).call();
    assert.equal(convertedDiluted1, convertedDiluted2);
    assert.equal(convertedDiluted2, convertedDiluted3);
    const a2c0 = await token.methods.balanceOf(accounts[2], 0).call();
    const a2c1 = await token.methods.balanceOf(accounts[2], 1).call();
    assert.equal(a2c0, 400);
    assert.equal(a2c1, 50);

    await token.methods.convert(2, 1, 50).send({ from: accounts[3], gas: '6000000' });
    convertedDiluted1 = await token.methods.fullyDilutedBalanceOf(accounts[1]).call();
    convertedDiluted2 = await token.methods.fullyDilutedBalanceOf(accounts[2]).call();
    convertedDiluted3 = await token.methods.fullyDilutedBalanceOf(accounts[3]).call();
    assert.equal(convertedDiluted1, convertedDiluted2);
    assert.equal(convertedDiluted2, convertedDiluted3);
    const a3c1 = await token.methods.balanceOf(accounts[3], 1).call();
    let a3c2 = await token.methods.balanceOf(accounts[3], 2).call();
    assert.equal(a3c1, 75);
    assert.equal(a3c2, 50);

    await token.methods.convert(2, 0, 50).send({ from: accounts[3], gas: '6000000' });
    convertedDiluted1 = await token.methods.fullyDilutedBalanceOf(accounts[1]).call();
    convertedDiluted2 = await token.methods.fullyDilutedBalanceOf(accounts[2]).call();
    convertedDiluted3 = await token.methods.fullyDilutedBalanceOf(accounts[3]).call();
    assert.equal(convertedDiluted1, convertedDiluted2);
    assert.equal(convertedDiluted2, convertedDiluted3);

    const a3c0 = await token.methods.balanceOf(accounts[3], 0).call();
    a3c2 = await token.methods.balanceOf(accounts[3], 2).call();
    assert.equal(a3c0, 300);
    assert.equal(a3c2, 0);
  });
})