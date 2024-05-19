import { bigIntToBuffer } from '@/utils/ton'
import { memo } from 'react'
import { Handle, Position } from 'reactflow'
import { Address, beginCell, storeTransaction } from '@ton/core'
import { AddressRow } from '../AddressRow'
import { TxNodeData } from './MessageFlow'
import { cn } from '@/utils/cn'
import { WebviewWindow } from '@tauri-apps/api/window'

export const TxNode = memo(({ data }: { data: TxNodeData; id: string }) => {
  const tx = data.tx
  const txAddress = new Address(0, bigIntToBuffer(tx.address))
  const rootAddress = new Address(0, bigIntToBuffer(data.rootTx.address))

  const isTxError =
    (tx.description.type === 'generic' &&
      tx.description.computePhase.type === 'vm' &&
      tx.description.computePhase.exitCode !== 0) ||
    (tx.description.type === 'generic' &&
      tx.description.actionPhase &&
      tx.description.actionPhase?.resultCode !== 0) ||
    (tx.description.type === 'generic' && tx.description.bouncePhase?.type)

  let opCode = 0
  if (tx.inMessage?.body) {
    try {
      opCode = tx.inMessage.body.asSlice().preloadUint(32)
    } catch (e) {
      //
    }
  }

  let notificationErrorCode = 0
  if (tx.inMessage?.body) {
    try {
      const inSlice = tx.inMessage.body.asSlice()
      const op = inSlice.loadUint(32)
      if (op !== 0xf8a7ea5) {
        throw new Error('a')
      }
      // if (inSlice.remainingBits < 64 + 4 + 267 + 267 + 1) {
      //   throw new Error('b')
      // }

      inSlice.skip(64) // query id
      inSlice.loadCoins() // amount
      inSlice.loadAddress() // destination
      inSlice.loadAddress() // response_destination
      inSlice.loadMaybeRef() // ?
      inSlice.loadCoins() // forward_ton_amount
      const forward = inSlice.loadMaybeRef()?.asSlice()

      forward?.skip(32)
      forward?.skip(64)

      notificationErrorCode = forward?.loadUint(32) || 0
      console.log('notificationErrorCode', notificationErrorCode)
    } catch (e) {
      //
      // console.log('err', e)
    }
  }

  return (
    <div
      className={cn(
        'p-2 rounded border',
        rootAddress.equals(txAddress)
          ? 'bg-blue-500 text-white'
          : 'bg-secondary text-secondary-foreground',
        isTxError && 'bg-red-500 text-white'
      )}
    >
      <AddressRow address={txAddress} />
      <div>ID: {tx.id}</div>
      <div>LT: {tx.lt.toString()}</div>
      <div>Self Fees: {Number(tx.totalFees.coins) / 10 ** 9}</div>
      {/* <div>Total Fees: {tonToNumber(tx.gasFull)}</div> */}
      {tx.description.type === 'generic' && tx.description.computePhase.type === 'vm' && (
        <div>OpCode: 0x{opCode.toString(16)}</div>
      )}
      {notificationErrorCode ? (
        <div>
          NotificationErrorCode: {notificationErrorCode} {notificationErrorCode.toString(16)}
        </div>
      ) : (
        <></>
      )}
      {tx.description.type === 'generic' && tx.description.computePhase.type === 'vm' && (
        <div>Compute Code: {tx.description.computePhase.exitCode}</div>
      )}
      {tx.description.type === 'generic' && (
        <div>Action Code: {tx.description.actionPhase?.resultCode}</div>
      )}
      {tx.description.type === 'generic' && tx.description.bouncePhase?.type && (
        <div>Bounce Phase Type: {tx.description.bouncePhase?.type}</div>
      )}

      {tx?.parsed?.schema && <div>Schema: {tx.parsed?.schema}</div>}
      {tx?.parsed?.internal && <div>Type: {tx.parsed?.internal}</div>}
      {tx?.parsed?.internal && tx?.parsed?.internal === 'jetton_transfer' && (
        <>
          <div>Jetton Amount: {tx.parsed.data.amount.toString()}</div>
          <div>
            To: <AddressRow address={tx.parsed.data.destination ?? ''} />
          </div>
        </>
      )}
      <div>
        <button
          onClick={() => {
            const webview = new WebviewWindow(`txinfo:${tx.lt}:${tx.address.toString()}`, {
              focus: true,
              // transparent: true,
              url: '/txinfo',
              center: true,
              title: `Transaction ${tx.lt} ${tx.address.toString()}`,
            })
            // since the webview window is created asynchronously,
            // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
            webview.once('tauri://created', function () {
              setTimeout(() => {
                webview.emit('txinfo', {
                  tx: beginCell().store(storeTransaction(tx)).endCell().toBoc().toString('base64'),
                  vmLogs: (tx as any).vmLogs,
                  debugLogs: (tx as any).debugLogs,
                  blockchainLogs: (tx as any).blockchainLogs,
                })
              }, 1000)
            })
          }}
        >
          Open full tx info
        </button>
      </div>

      <Handle type="target" position={Position.Top} draggable={false} isConnectable={false} />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        draggable={false}
        className=""
      ></Handle>
    </div>
  )
})
