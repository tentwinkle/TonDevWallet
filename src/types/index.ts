import {
  HighloadWalletV2,
  HighloadWalletV2R2,
} from '@/contracts/highload-wallet-v2/HighloadWalletV2'
import { WalletTransfer } from '@/contracts/utils/HighloadWalletTypes'
import { EncryptedWalletData } from '@/store/passwordManager'
import type { Address, MessageRelaxed, SendMode, ContractProvider, Cell } from '@ton/core'
import type { WalletContractV4, WalletContractV3R2 } from '@ton/ton'
import { KeyPair } from '@ton/crypto'
import { HighloadWalletV3 } from '@/contracts/highload-wallet-v3/HighloadWalletV3'

export type OpenedContract<T> = {
  [P in keyof T]: P extends `get${string}` | `send${string}`
    ? T[P] extends (x: ContractProvider, ...args: infer P_1) => infer R
      ? (...args: P_1) => R
      : never
    : T[P]
}

export type GetExternalMessageCell = (
  keyPair: KeyPair,
  transfers: WalletTransfer[]
) => Promise<Cell>

export interface ITonWalletV3 {
  type: 'v3R2'
  address: Address
  wallet: OpenedContract<WalletContractV3R2>
  getExternalMessageCell: GetExternalMessageCell
  key: EncryptedWalletData
  id: number
  subwalletId: number
}

export interface ITonWalletV4 {
  type: 'v4R2'
  address: Address
  wallet: OpenedContract<WalletContractV4>
  getExternalMessageCell: GetExternalMessageCell
  key: EncryptedWalletData
  id: number
  subwalletId: number
}

export interface ITonHighloadWalletV2 {
  type: 'highload'
  address: Address
  wallet: HighloadWalletV2
  getExternalMessageCell: GetExternalMessageCell
  key: EncryptedWalletData
  id: number
  subwalletId: number
}

export interface ITonHighloadWalletV2R2 {
  type: 'highload_v2r2'
  address: Address
  wallet: HighloadWalletV2R2
  getExternalMessageCell: GetExternalMessageCell
  key: EncryptedWalletData
  id: number
  subwalletId: number
}

export interface ITonHighloadWalletV3 {
  type: 'highload_v3'
  address: Address
  wallet: HighloadWalletV3
  getExternalMessageCell: GetExternalMessageCell
  key: EncryptedWalletData
  id: number
  subwalletId: number
}

export interface ITonExternalWallet {
  type: 'external'
  id: string
}

export type ITonWallet = ITonWalletV3 | ITonWalletV4
export type IHighloadWalletV2 = ITonHighloadWalletV2 | ITonHighloadWalletV2R2
export type IHighloadWalletV3 = ITonHighloadWalletV3

export type IWallet = ITonWallet | IHighloadWalletV2 | IHighloadWalletV3

export type WalletType = IWallet['type'] // v3R2' | 'v4R2' | 'highload' | 'highload_v2r2'

export type TonWalletTransferArg = {
  seqno: number
  secretKey: Buffer
  messages: MessageRelaxed[]
  sendMode?: SendMode
  timeout?: number
}

export interface SavedWallet {
  id: number
  type: WalletType
  key_id: number
  subwallet_id: number
}
