import { WalletTransfer } from '@/contracts/utils/HighloadWalletTypes'
import { TonConnectMessageTransaction, changeConnectMessageStatus } from '@/store/connectMessages'
import { useLiteclient } from '@/store/liteClient'
import { useTonConnectSessions } from '@/store/tonConnect'
import { useWalletListState } from '@/store/walletsListState'
import { IWallet } from '@/types'
import { ConnectMessageStatus } from '@/types/connect'
import { sendTonConnectMessage } from '@/utils/tonConnect'
import { getWalletFromKey, useWalletExternalMessageCell, useTonapiTxInfo } from '@/utils/wallets'
import { State, ImmutableObject } from '@hookstate/core'
import {
  SendTransactionRpcResponseSuccess,
  SendTransactionRpcResponseError,
  SEND_TRANSACTION_ERROR_CODES,
} from '@tonconnect/protocol'
import { useMemo } from 'react'
import { Address, Cell } from 'ton-core'
import { keyPairFromSeed } from 'ton-crypto'
import { LiteClient } from 'ton-lite-client'
import { AddressRow } from '../AddressRow'
import { Block } from '../ui/Block'
import { BlueButton } from '../ui/BlueButton'

export function MessageRow({ s }: { s: State<ImmutableObject<TonConnectMessageTransaction>> }) {
  const keys = useWalletListState()
  const liteClient = useLiteclient() as unknown as LiteClient
  const sessions = useTonConnectSessions()

  const key = keys.find((k) => k.id.get() === s.key_id.get())
  if (!key) {
    return <></>
  }

  const wallet = key.wallets.get()?.find((w) => w.id === s.wallet_id.get())
  if (!wallet) {
    return <></>
  }

  const session = useMemo(
    () => sessions.find((session) => session.id.get() === s.connect_session_id.get()),
    [sessions]
  )

  const walletKeyPair = useMemo(
    () => keyPairFromSeed(Buffer.from(key.seed.get() || '', 'hex')),
    [key.seed]
  )
  const tonWallet = useMemo(() => getWalletFromKey(liteClient, key, wallet), [liteClient, wallet])

  const transfers = useMemo(
    () =>
      s.payload.messages
        .map((m) => {
          if (!m.address.get() || !m.amount.get()) {
            return undefined
          }

          let destination
          try {
            destination = Address.parse(m.address.get() || '')
          } catch (e) {}

          const p = m.payload.get()
          const payload = p ? Cell.fromBase64(p) : undefined

          const stateInitData = m.stateInit.get()
          const state = stateInitData ? Cell.fromBase64(stateInitData) : undefined

          return {
            body: payload,
            destination,
            amount: BigInt(m.amount.get()),
            mode: 3,
            state,
          }
        })
        .filter((m) => m) as WalletTransfer[],
    [s.payload.messages]
  )

  const messageCell = useWalletExternalMessageCell(tonWallet, walletKeyPair, transfers)

  const approveMessage = async () => {
    console.log('do approve')
    const msg: SendTransactionRpcResponseSuccess = {
      id: s.connect_event_id.get().toString(),
      result: messageCell?.toBoc().toString('base64') || '',
    }

    await sendTonConnectMessage(
      msg,
      session?.secretKey.get() || Buffer.from(''),
      session?.userId?.get() || ''
    )

    await liteClient.sendMessage(messageCell?.toBoc() || Buffer.from(''))

    changeConnectMessageStatus(s.id.get(), ConnectMessageStatus.REJECTED)
  }

  const rejectMessage = async () => {
    console.log('do reject')
    changeConnectMessageStatus(s.id.get(), ConnectMessageStatus.REJECTED)

    const msg: SendTransactionRpcResponseError = {
      id: s.connect_event_id.get().toString(),
      error: {
        code: SEND_TRANSACTION_ERROR_CODES.USER_REJECTS_ERROR,
        message: 'User rejected',
      },
    }

    await sendTonConnectMessage(
      msg,
      session?.secretKey.get() || Buffer.from(''),
      session?.userId?.get() || ''
    )
  }

  return (
    <Block className="">
      <div className="flex items-center">
        <img src={session?.iconUrl.get()} alt="icon" className="w-8 h-8 rounded-full" />
        <div className="ml-2">{session?.name.get()}</div>
        <a href={session?.url.get()} target="_blank" className="ml-2" rel="noopener noreferrer">
          {session?.url.get()}
        </a>
      </div>

      <div className="break-keep">
        {
          <AddressRow
            text={<div className="w-40 flex-shrink-0">{`Wallet (${wallet.type}): `}</div>}
            address={tonWallet?.address}
          />
        }
      </div>

      <div className="flex items-center gap-2 my-2">
        <BlueButton
          onClick={() => {
            rejectMessage()
          }}
        >
          Reject
        </BlueButton>
        <BlueButton
          onClick={() => {
            // deleteConnectMessage(s.id.get())
            approveMessage()
          }}
          className="bg-green-500"
        >
          Approve
        </BlueButton>
      </div>

      <MessageEmulationResult s={s} messageCell={messageCell} tonWallet={tonWallet} />
    </Block>
  )
}

export function MessageEmulationResult({
  s,
  messageCell,
  tonWallet,
}: {
  s: State<ImmutableObject<TonConnectMessageTransaction>>
  messageCell?: Cell
  tonWallet?: IWallet
}) {
  const amountOut =
    Number(s.payload.get().messages.reduce((acc, c) => acc + BigInt(c.amount), 0n)) / 10 ** 9

  const { response: txInfo, progress, isLoading } = useTonapiTxInfo(messageCell)

  return (
    <>
      <div className="flex">
        <div>Messages count:&nbsp;</div>
        <div className="break-words break-all">
          {s.payload.get().messages.length} ({amountOut.toString()})
        </div>
      </div>

      <div className="flex flex-col">
        <div>Tx Actions:</div>
        <div className="break-words break-all flex flex-col gap-2">
          {/* {isLoading ? (
            <>
              Progress: {progress.done} / {progress.total}
            </>
          ) : ( */}
          <div>
            Progress: {progress.done} / {progress.total}
          </div>
          {isLoading && <div>Emulating...</div>}
          {txInfo?.events?.map((action, i) => {
            return (
              <Block key={i} className="flex flex-col">
                <div>Name: {action.type}</div>
                {action.type === 'message_sent' && (
                  <>
                    <div>Amount: {Number(action.value) / 10 ** 9} TON</div>
                    <AddressRow
                      text={<span className="w-16 flex-shrink-0">From:</span>}
                      address={action.from}
                      addressClassName={
                        tonWallet?.address.equals(action.from) ? 'text-red-500' : undefined
                      }
                    />
                    <AddressRow
                      text={<span className="w-16 flex-shrink-0">To:</span>}
                      address={action.to}
                      addressClassName={
                        tonWallet?.address.equals(action.to) ? 'text-green-500' : undefined
                      }
                    />
                  </>
                )}
              </Block>
            )
          })}
        </div>
      </div>
    </>
  )
}
