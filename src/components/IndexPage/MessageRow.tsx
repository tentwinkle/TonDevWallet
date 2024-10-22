import { TonConnectMessageTransaction } from '@/store/connectMessages'
import { useLiteclient, useLiteclientState } from '@/store/liteClient'
import { openPasswordPopup, useDecryptWalletData, usePassword } from '@/store/passwordManager'
import { useTonConnectSessions } from '@/store/tonConnect'
import { useWalletListState } from '@/store/walletsListState'
import {
  ApproveTonConnectMessage,
  GetTransfersFromTCMessage,
  RejectTonConnectMessage,
} from '@/utils/tonConnect'
import { getWalletFromKey, useWalletExternalMessageCell } from '@/utils/wallets'
import { ImmutableObject, State } from '@hookstate/core'
import { memo, useMemo, useState } from 'react'
import { Cell } from '@ton/core'
import { KeyPair } from '@ton/crypto'
import { LiteClient } from 'ton-lite-client'
import { AddressRow } from '../AddressRow'
import { Block } from '../ui/Block'
import { BlueButton } from '../ui/BlueButton'
import { cn } from '@/utils/cn'
import { useEmulatedTxInfo } from '@/hooks/useEmulatedTxInfo'
import { MessageFlow } from './MessageFlow'
import { secretKeyToED25519 } from '@/utils/ed25519'
import { Button } from '@/components/ui/button'
import { faExpand } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

const emptyKeyPair: KeyPair = {
  publicKey: Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]),
  secretKey: Buffer.from([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]),
}

export const MessageRow = memo(function MessageRow({
  s,
}: {
  s: State<ImmutableObject<TonConnectMessageTransaction>>
}) {
  const keys = useWalletListState()
  const liteClient = useLiteclient() as unknown as LiteClient
  const sessions = useTonConnectSessions()
  const password = usePassword().password.get()

  const amountOut =
    Number(s?.payload?.get()?.messages?.reduce((acc, c) => acc + BigInt(c.amount), 0n)) / 10 ** 9

  const key = useMemo(() => {
    return keys.find((k) => k.id.get() === s.key_id.get())
  }, [keys])
  if (!key) {
    return <></>
  }

  const wallet = useMemo(() => key.wallets.get()?.find((w) => w.id === s.wallet_id.get()), [key])
  if (!wallet) {
    return <></>
  }

  const session = useMemo(
    () => sessions.find((session) => session.id.get() === s.connect_session_id.get()),
    [sessions]
  )

  const { decryptedData } = useDecryptWalletData(password, key.encrypted.get())

  const walletKeyPair = useMemo(() => {
    if (!decryptedData) {
      return undefined
    }
    return secretKeyToED25519(decryptedData?.seed || Buffer.from([]))
  }, [key.encrypted, decryptedData])
  const tonWallet = useMemo(
    () => getWalletFromKey(liteClient, key.get(), wallet),
    [liteClient, wallet, key]
  )

  const transfers = useMemo(
    () => GetTransfersFromTCMessage(s.payload.messages.get()),
    [s.payload.messages]
  )

  const messageCell = useWalletExternalMessageCell(
    tonWallet,
    password ? walletKeyPair : emptyKeyPair,
    transfers
  )

  const rejectConnectMessage = () => {
    RejectTonConnectMessage({
      message: s.get(),
      session: session?.get(),
    })
  }

  const approveConnectMessage = () => {
    if (!messageCell) {
      return
    }
    ApproveTonConnectMessage({
      liteClient,
      messageCell,
      connectMessage: s.get(),
      session: session?.get(),
      eventId: s.connect_event_id?.get()?.toString(),
    }).then()
  }

  return (
    <Block className="p-4 rounded-lg shadow-md bg-white dark:bg-gray-800">
      {session?.url.get() && (
        <div className="flex items-center mb-4">
          <Avatar className="w-8 h-8">
            <AvatarImage src={session?.iconUrl.get()} />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>

          <div className="ml-2 text-gray-700 dark:text-gray-300">{session?.name.get()}</div>
          <a
            href={session?.url.get()}
            target="_blank"
            className="ml-2 text-blue-500 dark:text-blue-300"
            rel="noopener noreferrer"
          >
            {session?.url.get()}
          </a>
        </div>
      )}

      <div className="break-keep mb-4">
        {
          <AddressRow
            text={<div className="w-40 flex-shrink-0 text-gray-700 dark:text-gray-300">{`Wallet (${wallet.type}): `}</div>}
            address={tonWallet?.address}
          />
        }
      </div>
      <div className="flex mb-4">
        <div className="text-gray-700 dark:text-gray-300">Messages count:&nbsp;</div>
        <div className="break-words break-all text-gray-700 dark:text-gray-300">
          {s?.payload?.get()?.messages?.length} ({amountOut.toString()} TON)
        </div>
      </div>

      {password ? (
        <>
          <div className="flex items-center gap-2 my-2">
            <BlueButton variant={'outline'} onClick={rejectConnectMessage}>
              Reject
            </BlueButton>
            <BlueButton
              onClick={approveConnectMessage}
              className={cn('bg-green-500', 'disabled:bg-gray-400')}
              disabled={!messageCell || !walletKeyPair}
            >
              Approve
            </BlueButton>
          </div>
        </>
      ) : (
        <>
          <BlueButton onClick={rejectConnectMessage}>Reject</BlueButton>
          <BlueButton onClick={openPasswordPopup} className="ml-2 mt-2 bg-green-500">
            Unlock wallet
          </BlueButton>
        </>
      )}

      <MessageEmulationResult
        messageCell={messageCell}
        ignoreChecksig={!walletKeyPair} // do not ignore checksig if we use real keypair
      />
    </Block>
  )
})

export function MessageEmulationResult({
  messageCell,
  ignoreChecksig,
}: {
  messageCell?: Cell
  ignoreChecksig?: boolean
}) {
  const isTestnet = useLiteclientState().selectedNetwork.is_testnet.get()
  const { response: txInfo, isLoading } = useEmulatedTxInfo(messageCell, ignoreChecksig)
  const [max, setMax] = useState(false)

  return (
    <>
      <div className="flex flex-col">
        <div className="break-words break-all flex flex-col gap-2">
          <div>
            <Button variant={'outline'} className={'mt-4'} onClick={() => setMax((v) => !v)}>
              <FontAwesomeIcon icon={faExpand} className={'mr-2'} />
              Toggle Preview Size
            </Button>
          </div>

          <Block
            className={cn('h-[50vh]', max && 'h-[90vh]', 'p-0')}
            bg={isTestnet ? 'bg-[#22351f]' : 'bg-transparent'}
          >
            {!isLoading && <MessageFlow transactions={txInfo?.transactions} />}
          </Block>
        </div>
      </div>
    </>
  )
}
