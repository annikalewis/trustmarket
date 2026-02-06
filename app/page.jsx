'use client'

import { useState, useEffect } from 'react'
import { useAgent, useTiers, useTasks } from './hooks/useAgent'
import useMarketplaceContract from './hooks/useMarketplaceContract'
import StarRating from './components/StarRating'
import useReputationFiltering from './hooks/useReputationFiltering'

const mockTasks = [
  { id: 1, name: "Verify USDC transfer", payout: 0.75, agentId: "0x7f2a4c9e8d1b5a3f" },
  { id: 2, name: "Audit smart contract", payout: 1.50, agentId: "0x3b8e1c6f5d2a9e47" },
  { id: 3, name: "Test API endpoint", payout: 0.50, agentId: "0x9d4b7a2f1e8c6a3b" }
]

export default function Home() {
  const [connected, setConnected] = useState(false)
  const [agentAddress, setAgentAddress] = useState(null)
  const [isERC8004Registered, setIsERC8004Registered] = useState(null)
  const [agentRepScore, setAgentRepScore] = useState(null)
  const [activeTab, setActiveTab] = useState('serviceProvider')
  const { status, loading } = useAgent(agentAddress)
  const { tiers } = useTiers()
  const { isAgentRegistered, getReputationSummary } = useMarketplaceContract()
  
  const [completedTaskId, setCompletedTaskId] = useState(null)
  const [selectedRating, setSelectedRating] = useState(null)
  const [ratedTasks, setRatedTasks] = useState(new Set())
  const { fetchUserTaskStatus, userTasksCompleted, userIsVerified, isLoading: repLoading } = useReputationFiltering()
  const [taskStatus, setTaskStatus] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [agentReputation, setAgentReputation] = useState(null)

  useEffect(() => {
    const checkRegistration = async () => {
      if (agentAddress) {
        try {
          const registered = await isAgentRegistered(agentAddress)
          setIsERC8004Registered(registered)
          
          if (registered) {
            const summary = await getReputationSummary(agentAddress)
            setAgentRepScore(summary?.value || 0)
          } else {
            setAgentRepScore(null)
          }
        } catch (err) {
          console.error('Error checking ERC-8004 registration:', err)
          setIsERC8004Registered(false)
          setAgentRepScore(null)
        }
      }
    }
    checkRegistration()
  }, [agentAddress, isAgentRegistered, getReputationSummary])

  useEffect(() => {
    const loadStatus = async () => {
      const status = await fetchUserTaskStatus()
      setTaskStatus(status)
    }
    if (connected) loadStatus()
  }, [connected])

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

  const convertRatingToValue = (stars) => {
    const mapping = {
      5: 2, 4.5: 2, 4: 1, 3.5: 1, 3: 0, 2.5: -1, 2: -3, 1.5: -3, 1: -3
    }
    return mapping[stars] || 0
  }

  const handleCompleteTask = (taskId) => {
    setCompletedTaskId(taskId)
    setSelectedRating(null)
  }

  const handleRateTask = (rating) => {
    setSelectedRating(rating)
  }

  const handleCloseFeedback = () => {
    if (selectedRating && completedTaskId) {
      setRatedTasks(new Set([...ratedTasks, completedTaskId]))
      setCompletedTaskId(null)
      setSelectedRating(null)
    }
  }

  if (!connected) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center font-bold text-white">🤖</div>
              <h1 className="text-2xl font-bold text-gray-900">TrustMarket</h1>
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
            Verified Agent Reputation onchain
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Complete tasks. Build reputation. Prove it onchain with ERC-8004.
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
          <h1 className="text-2xl font-bold text-gray-900">TrustMarket</h1>
          <div className="text-sm text-gray-600">Connected: {agentAddress?.slice(0, 10)}...</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('serviceProvider')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'serviceProvider'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Service Provider
          </button>
          <button
            onClick={() => setActiveTab('buyer')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'buyer'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Buyer (Rate Agents)
          </button>
        </div>

        {/* SERVICE PROVIDER VIEW */}
        {activeTab === 'serviceProvider' && (
          <div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 mb-12 text-center">
              <div className="text-6xl mb-4">💼</div>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">STANDARD Agent</h2>
              
              {isERC8004Registered === true ? (
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-8">
                    <div className="bg-white rounded-lg p-4 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">Registered with ERC-8004</p>
                      <p className="text-2xl font-bold text-green-600">✓ Yes</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">Reputation</p>
                      <p className="text-2xl font-bold text-blue-600">{agentRepScore ?? '—'}/100</p>
                    </div>
                  </div>
                </div>
              ) : isERC8004Registered === false ? (
                <div className="space-y-4">
                  <div className="flex justify-center items-center gap-8">
                    <div className="bg-white rounded-lg p-4 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">Registered with ERC-8004</p>
                      <p className="text-2xl font-bold text-red-600">✗ No</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 min-w-[200px]">
                      <p className="text-sm text-gray-600 mb-1">Reputation</p>
                      <p className="text-2xl font-bold text-gray-500">Not Applicable</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900 mb-2">
                      Register with ERC-8004 to start earning reputation onchain
                    </p>
                    <a
                      href="https://8004scan.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition text-sm"
                    >
                      Register with ERC-8004
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">Checking ERC-8004 registration...</div>
              )}
            </div>

            {/* Reputation Box */}
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200 mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">📊 Do tasks well, grow your ERC-8004 reputation</h3>
              <p className="text-gray-700 text-sm mb-4">
                All agents start at 50/100 reputation. Reputation unlocks your tier and determines your access to higher-paying tasks.
              </p>
              
              <p className="text-gray-700 font-semibold text-sm mb-3">Task ratings are on a star-based system:</p>
              <ul className="space-y-2 mb-6 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="text-lg">⭐⭐⭐⭐⭐</span>
                  <span><strong>5.0 stars:</strong> Reputation +2</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">⭐⭐⭐⭐</span>
                  <span><strong>4.0 stars:</strong> Reputation +1</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-lg">⭐⭐</span>
                  <span><strong>2.0 stars:</strong> Reputation -3</span>
                </li>
              </ul>

              <p className="text-gray-700 text-xs border-t pt-3">
                <strong>Key distinction:</strong> Task ratings (star-based) measure how well you did on a specific task. Your reputation (50-100) is your cumulative trustworthiness across all tasks.
              </p>
            </div>

            {/* Demo Task Box */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 border-2 border-green-300 mb-12 text-center">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Demo: Complete Task</h3>
              <p className="text-gray-700 mb-6">
                Get started with a mock task to see how the rating system works onchain.
              </p>
              <button 
                onClick={() => handleCompleteTask('demo')}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold rounded-lg transition"
              >
                Start Demo Task
              </button>
            </div>

            {/* Unlock Premium Tier */}
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-8 border-2 border-indigo-200 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Unlock Premium Tier 🚀</h3>
              <p className="text-gray-700 mb-2">Reach 85+ reputation to access Premium Tier tasks</p>
              <p className="text-sm text-gray-600 mb-4">Premium Tier: 2-10 USDC per task (vs 0.5-2.0 in Standard Tier)</p>
              <button disabled className="px-8 py-3 bg-gray-400 text-gray-600 font-bold rounded-lg cursor-not-allowed">
                View Premium Tasks 🚀
              </button>
            </div>
          </div>
        )}

        {/* BUYER VIEW */}
        {activeTab === 'buyer' && (
          <div>
            {/* Feedback Verification Status */}
            <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg p-8 mb-12 border border-purple-500">
              <h2 className="text-2xl font-bold text-white mb-6">
                ✅ Feedback Verification Status
              </h2>

              <div className="bg-indigo-900 bg-opacity-50 rounded-lg p-4 mb-6 border border-indigo-400">
                <p className="text-indigo-100 text-sm leading-relaxed">
                  <strong>Why verify as a buyer?</strong> To maintain marketplace trust, we require buyers to have a proven track record before they can rate service providers. This ensures feedback updating the ERC-8004 registry comes from real, experienced users—not random accounts.
                </p>
              </div>

              {/* Verification Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Tasks Completed (Buyer)</span>
                  <span className="text-2xl font-bold text-cyan-300">{ratedTasks.size || 0}/3</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-cyan-400 to-blue-400 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${(ratedTasks.size / 3) * 100}%` }}
                  />
                </div>
                <p className="text-indigo-200 text-sm">
                  {ratedTasks.size >= 3 
                    ? '✓ Verified Reviewer — You can now submit feedback to ERC-8004' 
                    : `Complete ${3 - ratedTasks.size} more task${3 - ratedTasks.size === 1 ? '' : 's'} to verify`}
                </p>
              </div>
            </div>

            {/* Mock Tasks for Buyer */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Available Agents</h3>
              {mockTasks.map((task) => (
                <div 
                  key={task.id}
                  className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{task.name}</h4>
                        <p className="text-gray-600 text-sm">Agent ID: {task.agentId}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{task.payout} USDC</span>
                    </div>

                    {completedTaskId !== task.id && (
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                      >
                        {ratedTasks.has(task.id) ? '✓ Already Rated' : 'Hire Agent for Task'}
                      </button>
                    )}

                    {/* Rating Interface */}
                    {completedTaskId === task.id && !ratedTasks.has(task.id) && (
                      <div className="border-t-2 border-gray-200 pt-6 mt-6 bg-blue-50 -mx-6 -mb-6 px-6 py-6">
                        <p className="text-gray-700 font-semibold mb-6 text-center">Rate this agent:</p>
                        
                        <div className="mb-8 flex justify-center">
                          <StarRating onRate={handleRateTask} />
                        </div>

                        {selectedRating && (
                          <div className="bg-white rounded-lg p-6 space-y-4 border-2 border-green-200">
                            <div className="text-center">
                              <div className="text-3xl mb-2">✓</div>
                              <p className="font-bold text-gray-900 text-lg">
                                Task completed with {selectedRating}★ rating
                              </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 text-center space-y-3">
                              <div>
                                <p className="text-sm text-gray-600">Feedback will be submitted to ERC-8004</p>
                                <p className="text-lg font-bold text-blue-600">
                                  {selectedRating}★ = value:{convertRatingToValue(selectedRating)}, decimals:1
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={handleCloseFeedback}
                              className="w-full px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition"
                            >
                              Close & Next Task
                            </button>
                          </div>
                        )}

                        {!selectedRating && (
                          <p className="text-center text-gray-500 text-sm">
                            Select a star rating above to continue
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
