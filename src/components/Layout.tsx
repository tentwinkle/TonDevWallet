import { usePassword } from '@/store/passwordManager'
import { Outlet } from 'react-router-dom'
import { SavedWalletsList } from './SavedWalletsList/SavedWalletsList'
import { SetPasswordPage } from './SetPasswordPage'
import { TonConnectListener } from './TonConnect/TonConnectListener'

export function Layout() {
  const passworState = usePassword()
  return passworState.passwordExists.get() ? (
    <div className="grid grid-cols-[128px_minmax(128px,_1fr)] w-full pr-4">
      <div className="h-screen sticky top-0 place-self-start">
        <TonConnectListener />
        <SavedWalletsList />
      </div>
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  ) : (
    <SetPasswordPage />
  )
}
