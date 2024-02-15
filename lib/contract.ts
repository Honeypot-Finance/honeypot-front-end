import BigNumber from "bignumber.js"
import { ethers, Contract } from "ethers"
import Vue from "vue"
import { ee } from "./event"

export const exec = async (contract: Contract, contractMethod: string, args: any = []) => {
  const execArgs = [...args]
  let estimatedGas: ethers.BigNumber
  try {
    estimatedGas =
      await contract.estimateGas[contractMethod](...args)
  } catch (error) {
    if (error.message.includes('reason="execution reverted:')) {
       const reason = error.message.split('reason="execution reverted:')[1].split('"')[0]
       ee.emit('alerts','cancel', reason)
       throw error
    }
    console.error(error, `${contractMethod}-estimatedGas`)
  }
  if (estimatedGas) {
    execArgs.push({
      gasLimit: new BigNumber(estimatedGas.toString()).multipliedBy(1.25).toFixed(0),
    })
  } else {
    const manualGas = ethers.utils.parseUnits('36000', 'wei')
    execArgs.push({
      gasLimit: manualGas
    })
  }
  const res = await contract[contractMethod](...execArgs)
  await res.wait()
}
