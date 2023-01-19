import { useDatabase } from '@/db'
import { saveKeyAndWallets } from '@/store/walletsListState'
import { Key } from '@/types/Key'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { keyPairFromSeed } from 'ton-crypto'
import Copier from '../copier'
import { BlueButton } from '../ui/BlueButton'

export function FromSeed() {
  const navigate = useNavigate()
  const db = useDatabase()

  const nameRef = useRef<HTMLInputElement | null>(null)
  const [seed, setSeed] = useState('')
  const [mnemonicKey, setMnemonicKey] = useState<Key>({
    id: 0,
    name: '',
    seed: undefined,
    wallet_id: 0,
    words: '', // target.value,
    keyPair: undefined,
  })

  const onWordsChange = async (e: any) => {
    try {
      setSeed(e.target.value)
      // const mnemonic = e.target.value.split(' ')
      const data = e.target.value
      if (data.length !== 64) {
        setMnemonicKey({
          id: 0,
          name: '',
          seed: undefined,
          wallet_id: 0,
          words: '', // target.value,
          keyPair: undefined,
        })
        return
      }

      const ls = Buffer.from(data, 'hex')
      // const ls = (await mnemonicToSeed(mnemonic, 'TON default seed')).subarray(0, 32)

      setMnemonicKey({
        id: 0,
        name: '',
        seed: data,
        wallet_id: 0,
        words: '',
        keyPair: keyPairFromSeed(ls),
      })
    } catch (e) {
      console.log('onWordsChange error', e)
    }
  }

  return (
    <div>
      <div className="flex flex-col">
        <label htmlFor="seedInput">Seed</label>
        <input
          className="w-3/4 outline-none border p-1"
          id="seedInput"
          onChange={onWordsChange}
          value={seed}
        />
        {/* <input type="text" id="mnemonicInput" className="border rounded p-2 w-96" /> */}
      </div>

      {mnemonicKey.keyPair && mnemonicKey.seed && (
        <>
          <div>
            <div className="text-accent text-lg font-medium my-2 flex items-center">Seed:</div>
            <div className="flex">
              <div className="w-96 overflow-hidden text-ellipsis text-xs">{mnemonicKey.seed}</div>
              <Copier className="w-6 h-6 ml-2" text={mnemonicKey.seed || ''} />
            </div>
          </div>
          <div>
            <div className="text-accent text-lg font-medium my-2 flex items-center">
              Public key:
            </div>
            <div className="flex">
              <div className="w-96 overflow-hidden text-ellipsis text-xs">
                {Buffer.from(mnemonicKey.keyPair?.publicKey || []).toString('hex')}
              </div>
              <Copier
                className="w-6 h-6 ml-2"
                text={Buffer.from(mnemonicKey.keyPair?.publicKey || []).toString('hex')}
              />
            </div>
          </div>
          <div>
            <div className="text-accent text-lg font-medium my-2 flex items-center">
              Secret key:
            </div>
            <div className="flex">
              <div className="w-96 overflow-hidden text-ellipsis text-xs">
                {Buffer.from(mnemonicKey.keyPair?.secretKey || []).toString('hex')}
              </div>
              <Copier
                className="w-6 h-6 ml-2"
                text={Buffer.from(mnemonicKey.keyPair?.secretKey || []).toString('hex')}
              />
            </div>
          </div>

          <div className="py-4 flex flex-col">
            <label htmlFor="nameRef">Name:</label>
            <input type="text" ref={nameRef} id="nameRef" className="border w-3/4 outline-none" />

            <BlueButton
              onClick={async () =>
                saveKeyAndWallets(db, mnemonicKey, nameRef.current?.value || '', navigate)
              }
              className="mt-2"
            >
              Save
            </BlueButton>
          </div>
        </>
      )}
    </div>
  )
}
