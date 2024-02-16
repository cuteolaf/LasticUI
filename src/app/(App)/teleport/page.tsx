'use client'

import Border from '@/components/border/Border'
import WalletStatus from '@/components/walletStatus/WalletStatus'
import { toShortAddress } from '@/utils/account/token'
import { Builder } from '@paraspell/sdk'
import { DispatchError, Hash } from '@polkadot/types/interfaces'
import { ISubmittableResult } from '@polkadot/types/types'
import { useBalance, useInkathon } from '@poppyseed/lastic-sdk'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export type TxCbOnSuccessParams = { blockHash: Hash; txHash: Hash }


const handleTransaction = ({
  onSuccess,
  onError,
  onResult = console.log,
}: {
  onSuccess: (prams: TxCbOnSuccessParams) => void,
  onError: (err: DispatchError) => void,
  onResult?: (result: ISubmittableResult) => void
}) => (result: ISubmittableResult): void => {
  onResult(result);
  if (result.dispatchError) {
    console.warn('[EXEC] dispatchError', result);
    onError(result.dispatchError);
    return;
  }

  if (result.status.isFinalized) {
    console.log('[EXEC] Finalized', result);
    console.log(`[EXEC] blockHash ${result.status.asFinalized}`);
    onSuccess({ blockHash: result.status.asFinalized, txHash: result.txHash });
  }
};

const txCb =
(
  onSuccess: (prams: TxCbOnSuccessParams) => void,
  onError: (err: DispatchError) => void,
  onResult: (result: ISubmittableResult) => void = console.log,
) =>
(result: ISubmittableResult): void => {
  onResult(result)
  if (result.dispatchError) {
    console.warn('[EXEC] dispatchError', result)
    onError(result.dispatchError)
  }

  if (result.status.isFinalized) {
    console.log('[EXEC] Finalized', result)
    console.log(`[EXEC] blockHash ${result.status.asFinalized}`)
    onSuccess({ blockHash: result.status.asFinalized, txHash: result.txHash })
  }
}

export const notificationTypes = {
  success: 'success',
  info: 'info',
  danger: 'danger',
  warn: 'warning',
};

export const showNotification = (
  message: string,
  type: keyof typeof notificationTypes = 'info',
): void => {
  const duration = type === 'danger' ? 15000 : 10000;
  console.log(`[${type.toUpperCase()}] ${message}`, `Duration: ${duration}ms`);
};

type ChainOptions = {
  [key: string]: string; // Adding an index signature
};

const chainOptions: ChainOptions = {
  'Rococo Relay Chain': '/assets/Images/NetworkIcons/rococo-img.svg',
  'Rococo Coretime Testnet': '/assets/Images/NetworkIcons/assethub.svg',
}


const Teleport = () => {
  const [amount, setAmount] = useState(NaN)
  const [isLoading, setIsLoading] = useState(false)
  const { api, relayApi, activeAccount, activeChain, activeRelayChain, activeSigner } = useInkathon()

  const { balanceFormatted, balance, tokenSymbol, tokenDecimals } = useBalance(activeAccount?.address, true, {
    forceUnit: false,
    fixedDecimals: 2,
    removeTrailingZeros: true,
  })

  const transactionCallback = handleTransaction({
    onSuccess: ({ blockHash }) => {
      showNotification(`Transaction finalized at blockHash ${blockHash}`, 'success');
    },
    onError: (error) => {
      showNotification(error.toString(), 'danger');
    },
  });

  const functionSendXCM = async (amountToSend: number) => {
    if (!activeAccount || !relayApi || !api) return

    setIsLoading(true)

    try {
      const call = await Builder(relayApi)
        .to('AssetHubKusama')
        .amount(amountToSend)
        .address(activeAccount.address)
        .build();

      call.signAndSend(activeAccount.address, { signer: activeSigner }, transactionCallback);
    } catch (error) {
      console.error('Error in XCM transaction:', error);
      // Check if error is an instance of Error
      if (error instanceof Error) {
        showNotification('Error in XCM transaction: ' + error.message, 'danger');
      } else {
        // If it's not an Error instance, you might just log it as a string
        showNotification('Error in XCM transaction: An unexpected error occurred.', 'danger');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const handleMaxClick = () => {
    setAmount(Number(balance)/ 10**tokenDecimals)
  }

  if (!activeAccount) {
    return (
      <section className="mx-auto max-w-9xl py-7 px-4 sm:px-6 lg:px-8">
      <Border>
        <WalletStatus customMessage='Connect your wallet to Teleport your assets'/>
      </Border>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-9xl py-7 px-4 sm:px-6 lg:px-8">
      <Border>
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4 font-syncopate">Teleport</h1>
          <p className="mb-6">
            Teleport assets between networks in the Polkadot and Kusama Ecosystem.
          </p>
          <Link href="/" className="mb-2 font-semibold">
            Click here to learn how it works
          </Link>
          <hr className="my-4 border-gray-9" />

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="mb-2">Source chain</p>
              <div className="relative w-full rounded-lg bg-opacity-20 py-2 pl-3 pr-10 text-left border border-gray-9 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                <span className="flex items-center">
                  <Image
                    src={chainOptions[activeRelayChain?.name || 'Rococo Relay Chain']}
                    alt=""
                    width='0'
                    height="0"
                    style={{ width: '2em', height: 'auto' }}
                    className="flex-shrink-0 h-6 w-6 rounded-full"
                  />
                  <span className="ml-3 block truncate">{activeRelayChain?.name}</span>
                </span>
              </div>
            </div>
            <div>
              <p className="mb-2">Destination</p>
              <div className="relative w-full rounded-lg bg-opacity-20 py-2 pl-3 pr-10 text-left border border-gray-9 focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                <span className="flex items-center">
                  <Image
                    src={chainOptions[activeChain?.name || 'Rococo Relay Chain']}
                    alt=""
                    width='0'
                    height="0"
                    style={{ width: '2em', height: 'auto' }}
                    className="flex-shrink-0 h-6 w-6 rounded-full"
                  />
                  <span className="ml-3 block truncate">{activeChain?.name}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2">Asset Amount</p>
            <div className="flex items-center p">
              <input
                type="number"
                placeholder="0"
                value={amount}
                min="0"
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                className="flex-1 p-2 bg-transparent border border-gray-9 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-7 focus:border-transparent"
              />
              <span className="ml-2">{tokenSymbol}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span>Balance: {balanceFormatted}</span>
              <button onClick={handleMaxClick} className="text-blue-500">Max</button>
            </div>
          </div>

          <button
            onClick={() => functionSendXCM(amount * 10 ** tokenDecimals)}
            disabled={isLoading} // Disable button when operation is in progress
            className={`w-full py-2 border border-gray-9 rounded-lg hover:bg-gray-3 ${isLoading ? 'bg-gray-10' : ''}`}
          >
            {isLoading ? 'Processing...' : 'Proceed To Confirmation'}
          </button>

          <p className="mt-6">
            You will receive {amount || 0} {tokenSymbol} on {activeChain?.name} to {toShortAddress(activeAccount?.address, 4)}
          </p>
        </div>
      </Border>
    </section>
  )
}

export default Teleport
