import {
  Horizon,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  Asset,
  BASE_FEE,
} from '@stellar/stellar-sdk';
import { BATTLE_ASSET_CODE } from './entities.js';
import { c } from '../log.js';

const horizon = new Horizon.Server('https://horizon-testnet.stellar.org');

let serverKeypair: Keypair | null = null;
let battleAsset: Asset | null = null;

export function initStellarAsset(): { publicKey: string; asset: Asset } {
  const secret = process.env.STELLAR_SERVER_SECRET;
  if (!secret) throw new Error('STELLAR_SERVER_SECRET not set');
  serverKeypair = Keypair.fromSecret(secret);
  battleAsset = new Asset(BATTLE_ASSET_CODE, serverKeypair.publicKey());
  console.log(c.cyan('[stellar]') + ` Issuer: ${serverKeypair.publicKey()}`);
  console.log(c.cyan('[stellar]') + ` Asset: ${BATTLE_ASSET_CODE}`);
  return { publicKey: serverKeypair.publicKey(), asset: battleAsset };
}

export function getServerKeypair(): Keypair {
  if (!serverKeypair) throw new Error('Stellar asset not initialized');
  return serverKeypair;
}

export function getBattleAsset(): Asset {
  if (!battleAsset) throw new Error('Stellar asset not initialized');
  return battleAsset;
}

export function getServerPublicKey(): string {
  return getServerKeypair().publicKey();
}

export async function setupIssuerFlags(): Promise<void> {
  const kp = getServerKeypair();
  const account = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.setOptions({
        setFlags: ((1 << 0) | (1 << 1) | (1 << 3)) as any, // AUTH_REQUIRED + AUTH_REVOCABLE + AUTH_CLAWBACK_ENABLED
      })
    )
    .setTimeout(30)
    .build();
  tx.sign(kp);
  await horizon.submitTransaction(tx);
  console.log(c.cyan('[stellar]') + ' Issuer flags set: AUTH_REQUIRED + AUTH_REVOCABLE + AUTH_CLAWBACK_ENABLED');
}

export async function issueBattleToken(playerPk: string): Promise<string> {
  const kp = getServerKeypair();
  const asset = getBattleAsset();
  const account = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.setTrustLineFlags({ trustor: playerPk, asset, flags: { authorized: true } }))
    .addOperation(Operation.payment({ destination: playerPk, asset, amount: '1' }))
    .setTimeout(30)
    .build();
  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  const txHash = result.hash;
  console.log(c.cyan('[stellar]') + ` Issued 1 BATTLE to ${playerPk.slice(0, 8)}... tx: ${txHash}`);
  return txHash;
}

export async function hasBattleToken(playerPk: string): Promise<boolean> {
  try {
    const account = await horizon.loadAccount(playerPk);
    const balance = account.balances.find(
      (b: any) => b.asset_code === BATTLE_ASSET_CODE && b.asset_issuer === getServerPublicKey()
    );
    return balance ? parseFloat((balance as any).balance) >= 1 : false;
  } catch {
    return false;
  }
}

export async function clawbackBattleToken(playerPk: string): Promise<string> {
  const kp = getServerKeypair();
  const asset = getBattleAsset();
  const account = await horizon.loadAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.clawback({ from: playerPk, asset, amount: '1' }))
    .setTimeout(30)
    .build();
  tx.sign(kp);
  const result = await horizon.submitTransaction(tx);
  console.log(c.cyan('[stellar]') + ` Clawback 1 BATTLE from ${playerPk.slice(0, 8)}... tx: ${result.hash}`);
  return result.hash;
}
