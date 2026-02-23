import {
  Keypair,
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Contract,
  rpc,
  xdr,
  nativeToScVal,
  Address,
} from '@stellar/stellar-sdk';
import { getServerKeypair } from '../payment/stellar-asset.js';
import { c, debug } from '../log.js';

let sorobanServer: rpc.Server | null = null;
let contractId: string | null = null;

export function initSorobanAdapter(): void {
  const rpcUrl = process.env.SOROBAN_RPC_URL;
  const id = process.env.SOROBAN_CONTRACT_ID;

  if (!rpcUrl || !id) {
    throw new Error('SOROBAN_RPC_URL and SOROBAN_CONTRACT_ID must be set');
  }

  sorobanServer = new rpc.Server(rpcUrl);
  contractId = id;
  console.log(c.cyan('[soroban]') + ` Contract: ${contractId}`);
  console.log(c.cyan('[soroban]') + ` RPC: ${rpcUrl}`);
}

function getServer(): rpc.Server {
  if (!sorobanServer) throw new Error('Soroban adapter not initialized');
  return sorobanServer;
}

function getContractId(): string {
  if (!contractId) throw new Error('Soroban adapter not initialized');
  return contractId;
}

interface TxResult {
  txHash: string;
  returnValue?: xdr.ScVal;
}

async function buildSignSubmit(
  kp: Keypair,
  method: string,
  args: xdr.ScVal[],
): Promise<TxResult> {
  const server = getServer();
  const account = await server.getAccount(kp.publicKey());
  const contract = new Contract(getContractId());

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get resource estimates
  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${(simResult as any).error}`);
  }

  const preparedTx = rpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(kp);

  const sendResult = await server.sendTransaction(preparedTx);
  debug('[soroban]', `tx sent: hash=${sendResult.hash}, status=${sendResult.status}`);

  if (sendResult.status === 'ERROR') {
    throw new Error(`Transaction send failed: ${sendResult.status}`);
  }

  // Poll for completion
  let getResult = await server.getTransaction(sendResult.hash);
  while (getResult.status === 'NOT_FOUND') {
    await new Promise((r) => setTimeout(r, 1000));
    getResult = await server.getTransaction(sendResult.hash);
  }

  if (getResult.status === 'FAILED') {
    throw new Error(`Transaction failed on-chain: ${sendResult.hash}`);
  }

  const returnValue = getResult.status === 'SUCCESS'
    ? (getResult as rpc.Api.GetSuccessfulTransactionResponse).returnValue
    : undefined;

  return { txHash: sendResult.hash, returnValue };
}

function proofToBytes(proof: number[]): Buffer {
  return Buffer.from(new Uint8Array(proof));
}

function pubInputsToBytes(inputs: string[]): Buffer {
  const buffers = inputs.map((input) => {
    if (input.startsWith('0x')) {
      const hex = input.slice(2).padStart(64, '0');
      return Buffer.from(hex, 'hex');
    }
    const bn = BigInt(input);
    const hex = bn.toString(16).padStart(64, '0');
    return Buffer.from(hex, 'hex');
  });
  return Buffer.concat(buffers);
}

export interface OpenMatchParams {
  p1Pk: string; // Stellar G-address (server address for V1)
  p2Pk: string;
  proof1: number[];
  pubInputs1: string[];
  proof2: number[];
  pubInputs2: string[];
}

export interface OpenMatchResult {
  txHash: string;
  sessionId: number;
}

export async function openMatchOnChain(params: OpenMatchParams): Promise<OpenMatchResult> {
  const kp = getServerKeypair();

  const args = [
    new Address(params.p1Pk).toScVal(),
    new Address(params.p2Pk).toScVal(),
    nativeToScVal(proofToBytes(params.proof1), { type: 'bytes' }),
    nativeToScVal(pubInputsToBytes(params.pubInputs1), { type: 'bytes' }),
    nativeToScVal(proofToBytes(params.proof2), { type: 'bytes' }),
    nativeToScVal(pubInputsToBytes(params.pubInputs2), { type: 'bytes' }),
  ];

  const { txHash, returnValue } = await buildSignSubmit(kp, 'open_match', args);

  // Parse session_id (u32) from contract return value: Ok(session_id)
  let sessionId = 0;
  if (returnValue) {
    try {
      // Return is Result<u32, Error> — unwrap the Ok variant
      const val = returnValue.value();
      if (typeof val === 'number') {
        sessionId = val;
      } else if (returnValue.switch().name === 'scvU32') {
        sessionId = returnValue.u32();
      }
    } catch {
      debug('[soroban]', 'Could not parse session_id from return value');
    }
  }

  console.log(c.cyan('[soroban]') + ` open_match tx: ${txHash}, sessionId: ${sessionId}`);
  return { txHash, sessionId };
}

export interface CloseMatchParams {
  sessionId: number;
  proof: number[];
  pubInputs: string[];
  player1Won: boolean;
}

export async function closeMatchOnChain(params: CloseMatchParams): Promise<string> {
  const kp = getServerKeypair();

  const args = [
    nativeToScVal(params.sessionId, { type: 'u32' }),
    nativeToScVal(proofToBytes(params.proof), { type: 'bytes' }),
    nativeToScVal(pubInputsToBytes(params.pubInputs), { type: 'bytes' }),
    nativeToScVal(params.player1Won, { type: 'bool' }),
  ];

  const { txHash } = await buildSignSubmit(kp, 'close_match', args);
  console.log(c.cyan('[soroban]') + ` close_match tx: ${txHash}`);
  return txHash;
}
