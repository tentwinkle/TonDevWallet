import {
  EmulationResult,
  Executor,
  ExecutorVerbosity,
  RunTransactionArgs,
} from '@ton-community/sandbox/dist/executor/Executor'

import { base64Decode } from '@ton-community/sandbox/dist/utils/base64'
import EmulatorModule from '@ton-community/sandbox/dist/executor/emulator-emscripten.js'
import WasmJs from '@ton-community/sandbox/dist/executor/emulator-emscripten.wasm.js'

type EmulationInternalParams = {
  utime: number
  lt: string
  rand_seed: string
  ignore_chksig: boolean
}

const verbosityToNum: Record<ExecutorVerbosity, number> = {
  short: 0,
  full: 1,
  full_location: 2,
  full_location_stack: 3,
}

type ResultSuccess = {
  success: true
  transaction: string
  shard_account: string
  vm_log: string
  c7: string | null
  actions: string | null
}

type ResultError = {
  success: false
  error: string
} & (
  | {
      vm_log: string
      vm_exit_code: number
    }
  | object
)

export class ManagedExecutor extends Executor {
  static async create() {
    const ex = new ManagedExecutor(
      await EmulatorModule({
        wasmBinary: base64Decode(WasmJs.EmulatorEmscriptenWasm),
        printErr: (text: string) => ex.debugLogs.push(text),
      })
    )
    return ex
  }

  runTransaction(args: RunTransactionArgs): EmulationResult {
    const params: EmulationInternalParams = {
      utime: args.now,
      lt: args.lt.toString(),
      rand_seed: args.randomSeed === null ? '' : args.randomSeed.toString('hex'),
      ignore_chksig: true,
    }

    this.debugLogs = []
    const resp = JSON.parse(
      this.extractString(
        this.invoke('_emulate', [
          this.getEmulatorPointer(args.config, verbosityToNum[args.verbosity]),
          args.libs?.toBoc().toString('base64') ?? 0,
          args.shardAccount,
          args.message.toBoc().toString('base64'),
          JSON.stringify(params),
        ])
      )
    )
    const debugLogs = this.debugLogs.join('\n')

    if (resp.fail) {
      console.error(resp)
      throw new Error('Unknown emulation error')
    }

    const logs: string = resp.logs

    const result: ResultSuccess | ResultError = resp.output

    return {
      result: result.success
        ? {
            success: true,
            transaction: result.transaction,
            shardAccount: result.shard_account,
            vmLog: result.vm_log,
            c7: result.c7,
            actions: result.actions,
          }
        : {
            success: false,
            error: result.error,
            vmResults:
              'vm_log' in result
                ? {
                    vmLog: result.vm_log,
                    vmExitCode: result.vm_exit_code,
                  }
                : undefined,
          },
      logs,
      debugLogs,
    }
  }
}
