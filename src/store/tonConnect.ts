import { getDatabase } from '@/db'
import { hookstate, useHookstate } from '@hookstate/core'

interface TonConnectSession {
  id: number
  secretKey: Buffer
  userId: string
  walletId: number
  lastEventId: number
}

interface ConnectSession {
  id: number
  secret_key: string
  user_id: string
  wallet_id: number
  last_event_id: number
}

const state = hookstate<TonConnectSession[]>(async () => {
  const db = await getDatabase()
  const dbSessions = await db<ConnectSession>('connect_sessions').select('*')

  const sessions: TonConnectSession[] = dbSessions.map((dbSession) => {
    return {
      secretKey: Buffer.from(dbSession.secret_key, 'hex'),
      userId: dbSession.user_id,
      walletId: dbSession.wallet_id,
      lastEventId: dbSession.last_event_id,
      id: dbSession.id,
    }
  })

  return sessions
})

export function useTonConnectSessions() {
  return useHookstate(state)
}

export async function addTonConnectSession(secretKey: Buffer, userId: string, walletId: number) {
  const db = await getDatabase()
  const res = await db<ConnectSession>('connect_sessions')
    .insert({
      secret_key: secretKey.toString('hex'),
      user_id: userId,
      wallet_id: walletId,
      last_event_id: 0,
    })
    .returning('*')

  if (res.length < 1) {
    throw new Error("can't add session")
  }

  const session: TonConnectSession = {
    secretKey,
    userId,
    walletId,
    lastEventId: 0,
    id: res[0].id,
  }

  state.merge([session])
}

export async function updateSessionEventId(id: number, eventId: number) {
  const db = await getDatabase()
  const session = state.find((s) => s.get().id === id)
  if (!session) {
    throw new Error('session not found')
  }
  session?.merge({
    lastEventId: eventId,
  })

  await db<ConnectSession>('connect_sessions')
    .where({
      secret_key: session.secretKey.get().toString('hex'),
    })
    .update({
      last_event_id: eventId,
    })
  console.log('updated', session, eventId)
}
