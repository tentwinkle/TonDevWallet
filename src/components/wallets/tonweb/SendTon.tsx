import { useEffect, useState } from 'react'
import Popup from 'reactjs-popup'
import { Address, Cell, internal, loadStateInit } from 'ton'
import { ITonWallet, TonWalletTransferArg } from '../../../types'
import { BlueButton } from '../../UI'

export default function SendTon({
  seqno,
  wallet,
  updateBalance,
}: {
  seqno: string
  wallet: ITonWallet
  updateBalance: () => void
}) {
  const [amount, setAmount] = useState('0')
  const [recepient, setRecepient] = useState('')
  const [message, setMessage] = useState('')
  const [stateInit, setStateInit] = useState('')

  useEffect(() => {
    setAmount('0')
    setRecepient('')
    setMessage('')
    setStateInit('')
  }, [wallet])

  return (
    <div className="flex flex-col p-4 border rounded shadow">
      <div className="font-medium text-lg text-accent my-2">Send TON:</div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="toInput">Recepient:</label>
        <input
          className="border rounded p-2"
          id="toInput"
          type="text"
          value={recepient}
          onChange={(e: any) => setRecepient(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="amountInput">Amount:</label>
        <input
          className="border rounded p-2"
          id="amountInput"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount}
          onChange={(e: any) => setAmount(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="amountInput">Message:</label>
        <input
          className="border rounded p-2"
          id="amountInput"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={message}
          onChange={(e: any) => setMessage(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="amountInput">StateInit:</label>
        <p className="text-gray-600 text-sm my-1">Base64url encoded state init cell</p>
        <input
          className="border rounded p-2"
          id="amountInput"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={stateInit}
          onChange={(e: any) => setStateInit(e.target.value)}
        />
      </div>

      <SendModal
        amount={amount}
        recepient={recepient}
        wallet={wallet}
        seqno={seqno}
        message={message}
        stateInit={stateInit}
        updateBalance={updateBalance}
      />
    </div>
  )
}

const SendModal = ({
  amount,
  recepient,
  wallet,
  seqno,
  stateInit,
  message: sendMessage,
  updateBalance,
}: {
  amount: string
  recepient: string
  wallet: ITonWallet
  seqno: string
  message: string
  stateInit: string
  updateBalance: () => void
}) => {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const [status, setStatus] = useState(0) // 0 before send, 1 sending, 2 success, 3 error
  const [seconds, setSeconds] = useState(0)
  const [message, setMessage] = useState('')
  // const liteClient = useLiteclient()

  const clearPopup = () => {
    setStatus(0)
    setSeconds(0)
    setMessage('')
  }

  const checkSeqno = async (oldSeqno: number, seqs: number, interval: number) => {
    const newSeq = await wallet.wallet.getSeqno()
    const seqnoUpdated = newSeq && newSeq === oldSeqno + 1
    console.log('seqno check', newSeq, oldSeqno)

    if (seqnoUpdated) {
      setStatus(2)
      if (interval) {
        clearInterval(interval)
      }
      updateBalance()
      return
    }

    if (seqs === 0) {
      setStatus(3)
      if (interval) {
        clearInterval(interval)
      }
      setMessage('Send Timeout, seqno not increased')
    }
  }

  const sendMoney = async () => {
    const { address: rAddress, isBounceable: bounce } = Address.parseFriendly(recepient)
    const params: TonWalletTransferArg = {
      seqno: parseInt(seqno),
      secretKey: wallet.key.secretKey,
      sendMode: 3,
      messages: [
        internal({
          body: sendMessage ? Cell.fromBase64(sendMessage) : new Cell(),
          bounce,
          value: BigInt(amount),
          to: rAddress,
        }),
      ],
    }

    if (stateInit) {
      const parsed = Cell.fromBoc(Buffer.from(stateInit, 'base64'))[0] // TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(stateInit))
      if (parsed) {
        const init = loadStateInit(parsed.asSlice())
        params.messages[0].init = init
      }
    }

    try {
      const query = await wallet.wallet.createTransfer(params)
      await wallet.wallet.send(query)
      // const transfer = external({
      //   to: wallet.address,
      //   body: query,
      // })
      // const pkg = beginCell().store(storeMessage(transfer)).endCell().toBoc()
      // // const liteClient = useLiteclient()
      // const result = await liteClient.sendMessage(pkg)

      // if (result.status !== 1) {
      //   setStatus(3)
      //   setMessage(`Error occured. Code: ${result}. Message: ${result}`)
      //   return
      // }
    } catch (e) {
      console.log(e)
      setStatus(3)
      if (e instanceof Error) {
        setMessage('Error occured: ' + e.message)
      } else {
        setMessage('Unknown Error occured')
      }
      return
    }

    let secondsLeft = 30
    const oldSeqno = parseInt(seqno)
    const intervalId = window.setInterval(() => {
      setSeconds(--secondsLeft)

      if (secondsLeft % 5 === 0) {
        checkSeqno(oldSeqno, secondsLeft, intervalId)
      }

      if (secondsLeft === 0 && intervalId) {
        clearInterval(intervalId)
      }
    }, 1000)

    setStatus(1)
    setSeconds(secondsLeft)
  }

  return (
    <>
      <BlueButton className="mt-2" onClick={() => setOpen(true)}>
        Send
      </BlueButton>

      <Popup onOpen={clearPopup} onClose={clearPopup} open={open} closeOnDocumentClick modal>
        <div className="p-4">
          {status === 0 && (
            <div className="flex flex-col">
              <div>
                You will send {amount} TON to {recepient}.
              </div>
              <div className="mt-4">Are you sure?</div>
              <div className="flex mt-2">
                <BlueButton onClick={() => sendMoney()}>Yes</BlueButton>
                <BlueButton onClick={() => close()} className="ml-2">
                  Cancel
                </BlueButton>
              </div>
            </div>
          )}
          {status === 1 && <div>Sending {seconds}</div>}
          {status === 2 && (
            <div>
              <div>Success</div>
              <BlueButton className="mt-8" onClick={() => close()}>
                Close
              </BlueButton>
            </div>
          )}
          {status === 3 && (
            <div>
              <div>Error: {message}</div>
              <BlueButton className="mt-8" onClick={() => close()}>
                Close
              </BlueButton>
            </div>
          )}
        </div>
      </Popup>
    </>
  )
}
