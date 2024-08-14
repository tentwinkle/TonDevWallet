

export type ParsedTransaction = BlockchainTransaction & {
  parsed?: ParsedInternal
  parent?: ParsedTransaction | undefined
  children?: ParsedTransaction[]
}
export type ManagedSendMessageResult = {

}

export class ManagedBlockchain extends BlockchainWithExecutor {}
