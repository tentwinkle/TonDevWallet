import { suspend } from '@hookstate/core'
import { Knex } from 'knex'
import React from 'react'
import { DbContext } from './db'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useTonConnectSessions } from './store/tonConnect'
import { useWalletListState } from './store/walletsListState'

export function App({ db }: { db: Knex }) {
  const connectSessions = useTonConnectSessions()
  const keysList = useWalletListState()

  return (
    <DbContext.Provider value={db}>
      <React.Suspense>
        {suspend(connectSessions) || suspend(keysList) || <RouterProvider router={router} />}
        {/* {suspend(wallet) || <IndexPage />} */}
      </React.Suspense>
    </DbContext.Provider>
  )
}
