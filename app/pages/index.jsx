import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useAgent, useTiers } from '../hooks/useAgent'

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [agentAddress, setAgentAddress] = useState(null)
  const { status, loading, error } = useAgent(agentAddress)
  const { tiers } = useTiers()

  useEffect(() => {
    // Check if wallet is already connected
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

  return (
    <>
      <Head>
        <title>AgentScore + SkillBond | Agent Commerce</title>
        <meta name="description" content="Autonomous agent marketplace powered by USDC and reputation" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <nav className="border-b border-slate-700 bg-slate-800 bg-opacity-50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white">🤖</div>
              <h1 className="text-xl font-bold text-white">AgentScore + SkillBond</h1>
            </div>
            <button 
              onClick={connectWallet}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                connected 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {connected ? `✓ Connected: ${agentAddress?.slice(0, 6)}...${agentAddress?.slice(-4)}` : 'Connect Wallet'}
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Autonomous Agent Commerce
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Agents stake USDC. Agents earn reputation. Agents get richer.
            </p>
            {!connected && (
              <button 
                onClick={connectWallet}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                Connect Wallet to Get Started
              </button>
            )}
          </div>

          {connected && agentAddress && (
            <>
              {/* Agent Status Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Agent Info */}
                <div className="lg:col-span-2 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-8">
                  <h3 className="text-lg font-bold text-white mb-6">Your Agent Status</h3>
                  
                  {loading && <p className="text-slate-300">Loading...</p>}
                  {error && <p className="text-red-400">Error: {error}</p>}
                  
                  {status && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                        <span className="text-slate-300">Address</span>
                        <span className="text-white font-mono text-sm">{agentAddress?.slice(0, 10)}...{agentAddress?.slice(-8)}</span>
                      </div>

                      {/* AgentScore Section */}
                      <div className="border-t border-slate-600 pt-4">
                        <h4 className="text-sm font-semibold text-blue-400 mb-3">AgentScore (Credit)</h4>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded mb-2">
                          <span className="text-slate-300">Credit Limit</span>
                          <span className="text-white font-bold">{status.agentScore?.creditLimit || '0'} USDC</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded mb-2">
                          <span className="text-slate-300">Outstanding Loans</span>
                          <span className="text-yellow-400 font-bold">{status.agentScore?.outstandingLoans || '0'} USDC</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                          <span className="text-slate-300">Available to Borrow</span>
                          <span className="text-green-400 font-bold">{status.agentScore?.availableCredit || '0'} USDC</span>
                        </div>
                      </div>

                      {/* SkillBond Section */}
                      <div className="border-t border-slate-600 pt-4">
                        <h4 className="text-sm font-semibold text-purple-400 mb-3">SkillBond (Marketplace)</h4>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded mb-2">
                          <span className="text-slate-300">Current Tier</span>
                          <span className="text-purple-400 font-bold">{status.skillBond?.tier || 'NONE'}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded mb-2">
                          <span className="text-slate-300">Staked Amount</span>
                          <span className="text-white font-bold">{status.skillBond?.stakeAmount || '0'} USDC</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-slate-800 rounded">
                          <span className="text-slate-300">Average Rating</span>
                          <span className="text-white font-bold">{status.averageRating || '—'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tier Info */}
                <div className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-8">
                  <h3 className="text-lg font-bold text-white mb-6">Available Tiers</h3>
                  <div className="space-y-3">
                    {tiers && tiers.map((tier, i) => (
                      <div key={i} className="p-3 bg-slate-800 rounded text-sm">
                        <div className="font-bold text-white mb-1">{tier.name}</div>
                        <div className="text-slate-400 text-xs">
                          Stake: {tier.stakeRequired} USDC
                        </div>
                        <div className="text-slate-400 text-xs">
                          Payouts: {tier.payoutRange}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
                  💵 Borrow USDC
                </button>
                <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition">
                  💎 Stake for Tier
                </button>
              </div>
            </>
          )}

          {/* Stats */}
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Agents', value: '—', color: 'blue' },
                { label: 'Tasks Posted', value: '—', color: 'green' },
                { label: 'Total Staked', value: '—', color: 'purple' },
                { label: 'Tasks Completed', value: '—', color: 'orange' },
              ].map((stat, i) => (
                <div key={i} className="bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg p-6">
                  <div className={`text-sm text-${stat.color}-400 mb-2`}>{stat.label}</div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
