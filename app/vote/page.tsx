"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/hooks/use-wallet"
import { getVotingContract, VOTING_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contracts"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Ballot {
  id: number
  title: string
  description: string
  endTime: Date
  isActive: boolean
}

export default function VotePage() {
  const { isConnected, signer, provider } = useWallet()
  const [ballots, setBallots] = useState<Ballot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const router = useRouter()

  // Check if we're on the correct network
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
    if (isConnected && signer && !networkError) {
      fetchBallots()
    } else {
      setLoading(false)
    }
  }, [isConnected, signer, networkError])

  const fetchBallots = async () => {
    try {
      setLoading(true)
      setError(null)

      // First check if the contract exists at the address
      const code = await provider?.getCode(VOTING_CONTRACT_ADDRESS)
      if (!code || code === "0x") {
        setError(`No contract found at address ${VOTING_CONTRACT_ADDRESS}`)
        setLoading(false)
        return
      }

      const contract = getVotingContract(signer!)

      // Try the fallback approach - get active ballots directly
      try {
        const activeBallotIds = await contract.getActiveBallots()

        const ballotsData = await Promise.all(
          activeBallotIds.map(async (id: bigint) => {
            try {
              const ballot = await contract.getBallot(id)
              return {
                id: Number(id),
                title: ballot.title,
                description: ballot.description,
                endTime: new Date(Number(ballot.endTime) * 1000),
                isActive: ballot.isActive,
              }
            } catch (err) {
              console.warn(`Failed to fetch ballot ${id}:`, err)
              return null
            }
          }),
        )

        // Filter out any null results
        const validBallots = ballotsData.filter((ballot): ballot is Ballot => ballot !== null)
        setBallots(validBallots)
      } catch (err) {
        console.error("Error with getActiveBallots, trying manual approach:", err)

        // If getActiveBallots fails, try a manual approach
        // Try to fetch ballots one by one up to a reasonable limit
        const MAX_BALLOT_ID = 10 // Adjust based on expected number of ballots
        const manualBallots: Ballot[] = []

        for (let i = 0; i < MAX_BALLOT_ID; i++) {
          try {
            const ballot = await contract.getBallot(i)
            const endTime = new Date(Number(ballot.endTime) * 1000)
            const isActive = ballot.isActive && endTime.getTime() > Date.now()

            if (isActive) {
              manualBallots.push({
                id: i,
                title: ballot.title,
                description: ballot.description,
                endTime,
                isActive,
              })
            }
          } catch (err) {
            // If we get an error for a specific ballot ID, it might not exist
            // Just continue to the next one
            console.warn(`Ballot ${i} might not exist:`, err)
          }
        }

        setBallots(manualBallots)
      }
    } catch (error: any) {
      console.error("Error fetching ballots:", error)
      setError(error.message || "Failed to fetch ballots. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVoteClick = (ballotId: number) => {
    router.push(`/vote/${ballotId}`)
  }

  const handleRetry = () => {
    fetchBallots()
  }

  if (!isConnected) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl border border-vote-purple/20 dark:border-vote-purple/30 card-hover">
            <h1 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="mb-6">Please connect your wallet to view and participate in active ballots.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 gradient-text text-center">Active Ballots</h1>

          {networkError && (
            <Alert className="mb-6 border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Network Error</AlertTitle>
              <AlertDescription>{networkError}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="mb-6 border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button onClick={handleRetry} className="mt-2 bg-vote-purple hover:bg-vote-purple/90">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-vote-purple" />
            </div>
          ) : ballots.length > 0 ? (
            <div className="grid gap-6">
              {ballots.map((ballot, index) => {
                const colorClasses = [
                  "border-vote-purple/20 dark:border-vote-purple/30",
                  "border-vote-blue/20 dark:border-vote-blue/30",
                  "border-vote-teal/20 dark:border-vote-teal/30",
                  "border-vote-green/20 dark:border-vote-green/30",
                  "border-vote-orange/20 dark:border-vote-orange/30",
                ]
                const buttonClasses = [
                  "bg-vote-purple hover:bg-vote-purple/90",
                  "bg-vote-blue hover:bg-vote-blue/90",
                  "bg-vote-teal hover:bg-vote-teal/90",
                  "bg-vote-green hover:bg-vote-green/90",
                  "bg-vote-orange hover:bg-vote-orange/90",
                ]
                const titleClasses = [
                  "text-vote-purple",
                  "text-vote-blue",
                  "text-vote-teal",
                  "text-vote-green",
                  "text-vote-orange",
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
                        Ends on {ballot.endTime.toLocaleDateString()} at {ballot.endTime.toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>{ballot.description}</p>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleVoteClick(ballot.id)} className={buttonClasses[colorIndex]}>
                        Vote Now
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg bg-white/80 dark:bg-card/80 backdrop-blur-sm border-vote-purple/20 dark:border-vote-purple/30 card-hover">
              <h3 className="text-xl font-medium mb-2 gradient-text">No Active Ballots</h3>
              <p className="text-muted-foreground mb-6">There are currently no active ballots to vote on.</p>
              <Button onClick={() => router.push("/create")} className="bg-vote-purple hover:bg-vote-purple/90">
                Create a Ballot
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
