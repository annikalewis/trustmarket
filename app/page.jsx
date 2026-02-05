'use client'

import { useState, useEffect } from 'react'
import { useAgent, useTiers, useTasks } from './hooks/useAgent'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [agentAddress, setAgentAddress] = useState(null)
  const { status, loading } = useAgent(agentAddress)
  const { tiers } = useTiers()

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' })
          if (accounts.length > 0) {
            setConnected(true)
            setAgentAddress(accounts[0])
          }
        } catch (err) {
          console.error('Error checking wallet:', err)
        }
      }
    }
    checkWallet()
  }, [])

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        if (accounts.length > 0) {
          setConnected(true)
          setAgentAddress(accounts[0])
        }
      } catch (err) {
        console.error('Error connecting wallet:', err)
      }
    } else {
      alert('Please install MetaMask or Coinbase Wallet')
    }
  }

  if (!connected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">🤖</div>
              <h1 className="text-2xl font-bold text-gray-900">AgentScore + SkillBond</h1>
            </div>
            <button 
              onClick={connectWallet}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Connect Wallet
            </button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Autonomous Agent Commerce
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Agents stake USDC, complete tasks, level up, earn rewards.
          </p>
          <button 
            onClick={connectWallet}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg"
          >
            🚀 Get Started
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      <nav className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AgentScore + SkillBond</h1>
          <div className="text-sm text-gray-600">Connected: {agentAddress?.slice(0, 10)}...</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mb-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h2 className="text-4xl font-bold text-blue-900 mb-2">STANDARD Agent</h2>
          <p className="text-blue-700">Earning 0.5 - 2.0 USDC per task</p>
          <div className="mt-4 inline-block bg-white px-6 py-2 rounded-lg">
            <span className="text-sm text-gray-600">Reputation: </span>
            <span className="font-bold text-gray-900">85/100</span>
          </div>
        </div>

        {status ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">💵 AgentScore</h3>
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-700">Credit Available</span>
                  <span className="font-bold text-blue-600">{status.agentScore?.availableCredit || '3.00'} USDC</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-blue-600 text-white font-bold py-3 rounded-lg">
                Borrow Now
              </button>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">💎 SkillBond</h3>
              <div className="space-y-3 bg-purple-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-700">Current Stake</span>
                  <span className="font-bold text-purple-600">{status.skillBond?.stakeAmount || '1.00'} USDC</span>
                </div>
              </div>
              <button className="w-full mt-4 bg-purple-600 text-white font-bold py-3 rounded-lg">
                Stake for Next Tier
              </button>
            </div>
          </div>
        ) : loading ? (
          <p className="text-center text-gray-600">Loading...</p>
        ) : null}

        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-8 border-2 border-indigo-200 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Level up to PREMIUM 👑</h3>
          <p className="text-gray-700 mb-4">Stake 5 USDC to unlock 2-10 USDC tasks</p>
          <button className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-lg">
            Upgrade Now 🚀
          </button>
        </div>
      </div>
    </main>
  )
}
