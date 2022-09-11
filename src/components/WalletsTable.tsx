import { ITonExternalWallet, ITonHighloadWalletV2, ITonWebWallet, IWallet } from '../types'
import { AddressRow } from './AddressRow'

function TonWalletRow({
  wallet,
  isSelected,

  setWallet,
}: {
  wallet: ITonWebWallet
  isSelected: boolean
  setWallet: (wallet: IWallet) => void
}) {
  return (
    <div className="my-2 flex flex-col border" key={wallet.address.toString(true, true, true)}>
      <div className="flex justify-between border-b px-1">
        <div className="">
          Wallet {wallet.type}
          <a
            href={getScanLink(wallet.address.toString(true, true, true), false)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2"
          >
            Link
          </a>
        </div>

        {isSelected ? (
          <div>Selected</div>
        ) : (
          <div className="cursor-pointer text-highlight" onClick={() => setWallet(wallet)}>
            Use this wallet
          </div>
        )}
      </div>

      <div className="px-2 my-2">
        <AddressRow text="Bouncable:" address={wallet.address.toString(true, true, true)} />
        <AddressRow text="UnBouncable:" address={wallet.address.toString(true, true, false)} />
        <AddressRow text="Raw:" address={wallet.address.toString(false)} />
      </div>
    </div>
  )
}

function HighloadWalletRow({
  wallet,
  isSelected,

  setWallet,
}: {
  wallet: ITonHighloadWalletV2
  isSelected: boolean
  setWallet: (wallet: IWallet) => void
}) {
  return (
    <div
      className="my-2 flex flex-col border"
      key={wallet.address.toString('base64', { bounceable: true, urlSafe: true })}
    >
      <div className="flex justify-between border-b px-1">
        <div className="">
          Wallet {wallet.type}
          <a
            href={getScanLink(
              wallet.address.toString('base64', { bounceable: true, urlSafe: true }),
              false
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2"
          >
            Link
          </a>
        </div>

        {isSelected ? (
          <div>Selected</div>
        ) : (
          <div className="cursor-pointer text-highlight" onClick={() => setWallet(wallet)}>
            Use this wallet
          </div>
        )}
      </div>

      <div className="px-2 my-2">
        <AddressRow
          text="Bouncable:"
          address={wallet.address.toString('base64', { bounceable: true, urlSafe: true })}
        />
        <AddressRow
          text="UnBouncable:"
          address={wallet.address.toString('base64', { bounceable: false, urlSafe: true })}
        />
        <AddressRow text="Raw:" address={wallet.address.toString('raw')} />
      </div>
    </div>
  )
}

function ExternalWalletRow({
  wallet,
  isSelected,

  setWallet,
}: {
  wallet: ITonExternalWallet
  isSelected: boolean
  setWallet: (wallet: IWallet) => void
}) {
  return (
    <div className="my-2 flex flex-col border" key={wallet.id}>
      <div className="flex justify-between border-b px-1">
        <div className="">Wallet {wallet.type}</div>

        {isSelected ? (
          <div>Selected</div>
        ) : (
          <div className="cursor-pointer text-highlight" onClick={() => setWallet(wallet)}>
            Use this wallet
          </div>
        )}
      </div>
    </div>
  )
}

export function WalletsTable({
  walletsToShow,
  currentWallet,

  setWallet,
}: {
  walletsToShow?: IWallet[]
  currentWallet?: IWallet

  setWallet: (wallet: IWallet) => void
}) {
  return (
    <>
      <div className="font-medium text-lg text-accent my-2">Wallets:</div>

      {walletsToShow?.map((wallet) =>
        wallet.type === 'highload' ? (
          <HighloadWalletRow
            wallet={wallet}
            isSelected={currentWallet?.id === wallet.id}
            setWallet={setWallet}
            key={wallet.id}
          />
        ) : wallet.type === 'external' ? (
          <ExternalWalletRow
            wallet={wallet}
            isSelected={currentWallet?.id === wallet.id}
            setWallet={setWallet}
            key={wallet.id}
          />
        ) : (
          <TonWalletRow
            wallet={wallet}
            isSelected={currentWallet?.id === wallet.id}
            setWallet={setWallet}
            key={wallet.id}
          />
        )
      )}
    </>
  )
}

function getScanLink(address: string, testnet: boolean): string {
  return `https://${testnet ? 'testnet.' : ''}tonscan.org/address/${address}`
}
