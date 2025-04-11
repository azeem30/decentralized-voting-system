"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useWallet } from "@/hooks/use-wallet"
import { getVotingContract, VOTING_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contracts"
import { AlertCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BallotResult {
  id: number
  title: string
  description: string
  options: string[]
  votes: number[]
  totalVotes: number
  endTime: Date
  isActive: boolean
}

export default function ResultsPage() {
  const { isConnected, signer, provider } = useWallet()
  const [ballots, setBallots] = useState<BallotResult[]>([])
  const [loading, setLoading] = useState(true)
  const [networkError, setNetworkError] = useState<string | null>(null)

  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork()
          // Check if we're on Sepolia
          if (network.chainId !== SEPOLIA_CHAIN_ID) {
            setNetworkError(
              `Please connect to the Sepolia Test Network. Current network: ${network.name || network.chainId.toString()}`,
            )
          } else {
            setNetworkError(null)
          }
        } catch (err) {
          console.error("Error checking network:", err)
        }
      }
    }

    if (isConnected) {
      checkNetwork()
    }
  }, [isConnected, provider])

  useEffect(() => {
    if (isConnected && signer) {
      fetchBallots()
    } else {
      setLoading(false)
    }
  }, [isConnected, signer])

  const fetchBallots = async () => {
    try {
      setLoading(true)

      // First check if the contract exists at the address
      const code = await provider?.getCode(VOTING_CONTRACT_ADDRESS)
      if (!code || code === "0x") {
        console.error(`No contract found at address ${VOTING_CONTRACT_ADDRESS}`)
        setBallots([])
        setLoading(false)
        return
      }

      const contract = getVotingContract(signer!)

      // Get total ballot count
      const count = await contract.getBallotCount()

      // Fetch all ballots
      const ballotsData = await Promise.all(
        Array.from({ length: Number(count) }, (_, i) => i).map(async (id) => {
          try {
            const ballot = await contract.getBallot(id)

            const votes = ballot.votes.map((v: bigint) => Number(v))
            const totalVotes = votes.reduce((sum: number, current: number) => sum + current, 0)

            return {
              id,
              title: ballot.title,
              description: ballot.description,
              options: ballot.options,
              votes,
              totalVotes,
              endTime: new Date(Number(ballot.endTime) * 1000),
              isActive: ballot.isActive,
            }
          } catch (error) {
            console.error(`Error fetching ballot ${id}:`, error)
            return null
          }
        }),
      )

      // Filter out any null results and sort by end time (most recent first)
      const validBallots = ballotsData
        .filter((ballot): ballot is BallotResult => ballot !== null)
        .sort((a, b) => b.endTime.getTime() - a.endTime.getTime())

      setBallots(validBallots)
    } catch (error) {
      console.error("Error fetching ballots:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl border border-vote-purple/20 dark:border-vote-purple/30 card-hover">
            <h1 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="mb-6">Please connect your wallet to view ballot results.</p>
          </div>
        </div>
      </div>
    )
  }

  // Add network error display in the JSX
  if (networkError) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Alert className="border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Network Error</AlertTitle>
              <AlertDescription>{networkError}</AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 gradient-text text-center">Ballot Results</h1>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-vote-purple" />
            </div>
          ) : ballots.length > 0 ? (
            <div className="grid gap-8">
              {ballots.map((ballot, index) => {
                // Cycle through colors for each ballot
                const colorClasses = [
                  "border-vote-purple/20 dark:border-vote-purple/30",
                  "border-vote-blue/20 dark:border-vote-blue/30",
                  "border-vote-teal/20 dark:border-vote-teal/30",
                  "border-vote-green/20 dark:border-vote-green/30",
                  "border-vote-orange/20 dark:border-vote-orange/30",
                ]

                const titleClasses = [
                  "text-vote-purple",
                  "text-vote-blue",
                  "text-vote-teal",
                  "text-vote-green",
                  "text-vote-orange",
                ]

                const progressColors = [
                  "bg-vote-purple",
                  "bg-vote-blue",
                  "bg-vote-teal",
                  "bg-vote-green",
                  "bg-vote-orange",
                  "bg-vote-red",
                  "bg-vote-pink",
                  "bg-vote-yellow",
                ]

                const colorIndex = index % colorClasses.length

                return (
                  <Card
                    key={ballot.id}
                    className={`card-hover ${colorClasses[colorIndex]} bg-white/80 dark:bg-card/80 backdrop-blur-sm`}
                  >
                    <CardHeader>
                      <CardTitle className={titleClasses[colorIndex]}>{ballot.title}</CardTitle>
                      <CardDescription>
                        {ballot.isActive ? (
                          <span>Ends on {ballot.endTime.toLocaleDateString()}</span>
                        ) : (
                          <span>Ended on {ballot.endTime.toLocaleDateString()}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{ballot.description}</p>

                      <div className="space-y-4">
                        <div className="text-sm font-medium">Total votes: {ballot.totalVotes}</div>

                        {ballot.options.map((option, optIndex) => {
                          const voteCount = ballot.votes[optIndex]
                          const percentage =
                            ballot.totalVotes > 0 ? Math.round((voteCount / ballot.totalVotes) * 100) : 0
                          const progressColorIndex = optIndex % progressColors.length

                          return (
                            <div key={optIndex} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{option}</span>
                                <span>
                                  {voteCount} votes ({percentage}%)
                                </span>
                              </div>
                              <Progress
                                value={percentage}
                                className={`h-2 ${progressColors[progressColorIndex]} bg-gray-100 dark:bg-gray-800`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-white/80 dark:bg-card/80 backdrop-blur-sm border-vote-purple/20 dark:border-vote-purple/30 card-hover">
              <h3 className="text-xl font-medium mb-2 gradient-text">No Ballots Found</h3>
              <p className="text-muted-foreground">There are no ballots to display results for.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
