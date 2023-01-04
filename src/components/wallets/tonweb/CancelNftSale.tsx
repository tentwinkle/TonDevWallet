import { useState } from 'react'
import Popup from 'reactjs-popup'
import TonWeb from 'tonweb'
import { HttpProvider } from 'tonweb/dist/types/providers/http-provider'
import { ITonWebWallet } from '../../../types'
import { BlueButton } from '../../UI'

const { NftSale } = TonWeb.token.nft

export default function CancelNftSale({
  seqno,
  wallet,
  updateBalance,
}: {
  seqno: string
  wallet: ITonWebWallet
  updateBalance: () => void
}) {
  const [marketAddress, setMarketAddress] = useState('')
  const [nftAddress, setNftAddress] = useState('')
  const [collectionAddress, setCollectionAddress] = useState('')

  return (
    <div className="p-4 border rounded shadow">
      <div className="font-medium text-lg text-accent my-2">Cancel Nft Sale:</div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="nftToInput">Market address:</label>
        <input
          className="border rounded p-2"
          id="nftToInput"
          type="text"
          value={marketAddress}
          onChange={(e: any) => setMarketAddress(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="nftToInput">Nft address:</label>
        <input
          className="border rounded p-2"
          id="nftToInput"
          type="text"
          value={nftAddress}
          onChange={(e: any) => setNftAddress(e.target.value)}
        />
      </div>

      <div className="mt-2 flex flex-col">
        <label htmlFor="nftToInput">Collection address:</label>
        <input
          className="border rounded p-2"
          id="nftToInput"
          type="text"
          value={collectionAddress}
          onChange={(e: any) => setCollectionAddress(e.target.value)}
        />
      </div>

      {/* <div>Address: {marketAddress}</div> */}
      <CancelSaleModal
        marketAddress={marketAddress}
        nftAddress={nftAddress}
        collectionAddress={collectionAddress}
        wallet={wallet}
        seqno={seqno}
        updateBalance={updateBalance}
      />
    </div>
  )
}

const CancelSaleModal = ({
  marketAddress,
  nftAddress,
  collectionAddress,
  wallet,
  seqno,
  updateBalance,
}: {
  marketAddress: string
  nftAddress: string
  collectionAddress: string
  wallet: ITonWebWallet
  seqno: string
  updateBalance: () => void
}) => {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  const sendMoney = async (close: () => void) => {
    const amount = TonWeb.utils.toNano(1)

    const sale = new NftSale(new TonWeb.HttpProvider(), {
      marketplaceAddress: new TonWeb.utils.Address(marketAddress),
      nftAddress: new TonWeb.utils.Address(nftAddress),
      fullPrice: TonWeb.utils.toNano('1.1'),
      marketplaceFee: TonWeb.utils.toNano('0.2'),
      royaltyAddress: new TonWeb.utils.Address(collectionAddress),
      royaltyAmount: TonWeb.utils.toNano('0.1'),
    })
    const saleAddress = await sale.getAddress()

    await wallet.wallet.methods
      .transfer({
        secretKey: wallet.key.secretKey,
        toAddress: saleAddress,
        amount: amount,
        seqno: parseInt(seqno),
        payload: await sale.createCancelBody({}),
        sendMode: 3,
      })
      .send()

    updateBalance()
    close()
  }

  return (
    <>
      {!open && (
        <BlueButton className="mt-2" onClick={() => setOpen(true)}>
          Send
        </BlueButton>
      )}
      <Popup open={open} modal>
        <div className="flex flex-col p-4">
          <div>You will create marketplace.</div>
          <div className="mt-4">Are you sure?</div>
          <div className="flex mt-2">
            <div
              className="bg-highlight rounded px-2 py-2 text-white cursor-pointer"
              onClick={() => sendMoney(close)}
            >
              Yes
            </div>
            <div
              className="bg-highlight rounded px-2 py-2 text-white cursor-pointer ml-8"
              onClick={() => close()}
            >
              Cancel
            </div>
          </div>
        </div>
      </Popup>
    </>
  )
}
