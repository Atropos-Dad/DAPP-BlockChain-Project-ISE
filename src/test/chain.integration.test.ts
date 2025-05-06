// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { provider, getWalletFromEncryptedJson } from '../chain';

// A real encrypted JSON wallet with known password "test"
const sampleEncryptedJson = `{"address":"8a45fc49c5eb5fe20ff4a29e72a17ba30d4f9631","id":"cc3c87a5-d37b-4936-9344-b2077cbca499","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"94c0e6d776a6f93a81c1e53a3035341d"},"ciphertext":"dd664db40727e0c53bcb4d2059369034b5d239ee2074b2f015107d0e621b1f68","kdf":"scrypt","kdfparams":{"salt":"8df437881295b41d26f0e44d57d017ca4e69a6fbc45a0554b52dc41519e1e651","n":131072,"dklen":32,"p":1,"r":8},"mac":"9f71629664b98d64eecf34a78ecfd01a460714964b6fc0c02e362b7041ef2554"},"x-ethers":{"client":"ethers/6.13.5","gethFilename":"UTC--2025-04-22T08-35-23.0Z--8a45fc49c5eb5fe20ff4a29e72a17ba30d4f9631","path":"m/44'/60'/0'/0/0","locale":"en","mnemonicCounter":"b7ececa62d844ba30de87afe2e17c8ed","mnemonicCiphertext":"74bc37ae27d25785f164828220e31a79","version":"0.1"}}`;

describe('Integration Test: getWalletFromEncryptedJson', () => {
  it('should decrypt the wallet and connect it to the provider', async () => {
    const password = 'test';
    const wallet = await getWalletFromEncryptedJson(sampleEncryptedJson, password);

    // The address should match the one encoded in the JSON
    expect(wallet.address).toBe('0x8A45Fc49c5eB5fE20fF4a29e72a17BA30d4f9631');

    // The wallet should be connected to the same provider instance
    expect(wallet.provider).toBe(provider);
  });
}); 