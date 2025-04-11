"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useWallet } from "@/hooks/use-wallet"
import { getVotingContract, VOTING_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contracts"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BallotDetails {
  title: string
  description: string
  options: string[]
  votes: number[]
  startTime: Date
  endTime: Date
  creator: string
  isActive: boolean
}

export default function VoteBallotPage() {
  const { id } = useParams()
  const router = useRouter()
  const { isConnected, signer, provider, address } = useWallet()
  const [ballot, setBallot] = useState<BallotDetails | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

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
      fetchBallotDetails()
    } else {
      setLoading(false)
    }
  }, [isConnected, signer, id, networkError])

  const fetchBallotDetails = async () => {
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

      try {
        // Get ballot details
        const ballotData = await contract.getBallot(id)

        setBallot({
          title: ballotData.title,
          description: ballotData.description,
          options: ballotData.options,
          votes: ballotData.votes.map((v: bigint) => Number(v)),
          startTime: new Date(Number(ballotData.startTime) * 1000),
          endTime: new Date(Number(ballotData.endTime) * 1000),
          creator: ballotData.creator,
          isActive: ballotData.isActive,
        })

        // Check if user has already voted
        if (address) {
          const voted = await contract.hasVoted(id, address)
          setHasVoted(voted)
        }
      } catch (err: any) {
        console.error("Error fetching ballot details:", err)
        setError(err.message || "Failed to load ballot details. The ballot may not exist.")
      }
    } catch (error: any) {
      console.error("Error in ballot details:", error)
      setError(error.message || "Failed to load ballot details. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async () => {
    if (!selectedOption || !signer) return

    try {
      setSubmitting(true)
      setError(null)

      const contract = getVotingContract(signer)
      const optionIndex = ballot!.options.indexOf(selectedOption)

      // Submit vote transaction
      const tx = await contract.vote(id, optionIndex)
      await tx.wait()

      setHasVoted(true)
      setSuccess("Your vote has been recorded successfully!")
    } catch (error: any) {
      console.error("Error submitting vote:", error)
      setError(error.message || "Failed to submit your vote. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    fetchBallotDetails()
  }

  if (!isConnected) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl border border-vote-purple/20 dark:border-vote-purple/30 card-hover">
            <h1 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="mb-6">Please connect your wallet to view and participate in this ballot.</p>
          </div>
        </div>
      </div>
    )
  }

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

  if (loading) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-vote-purple" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Button
              variant="outline"
              className="mb-6 border-vote-purple/50 text-vote-purple hover:bg-vote-purple/10"
              onClick={() => router.push("/vote")}
            >
              ← Back to Ballots
            </Button>

            <Alert className="border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button onClick={handleRetry} className="mt-2 bg-vote-purple hover:bg-vote-purple/90">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    )
  }

  if (!ballot) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl border border-vote-red/20 dark:border-vote-red/30 card-hover">
            <h1 className="text-2xl font-bold mb-4 text-vote-red">Ballot Not Found</h1>
            <p className="mb-6">The ballot you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => router.push("/vote")} className="bg-vote-purple hover:bg-vote-purple/90">
              View All Ballots
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = new Date() > ballot.endTime
  const canVote = !hasVoted && !isExpired && ballot.isActive

  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            className="mb-6 border-vote-purple/50 text-vote-purple hover:bg-vote-purple/10"
            onClick={() => router.push("/vote")}
          >
            ← Back to Ballots
          </Button>

          <Card className="card-hover border-vote-purple/20 dark:border-vote-purple/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">{ballot.title}</CardTitle>
              <CardDescription>
                {isExpired ? (
                  <span className="text-vote-red">Ended on {ballot.endTime.toLocaleDateString()}</span>
                ) : (
                  <span>
                    Ends on {ballot.endTime.toLocaleDateString()} at {ballot.endTime.toLocaleTimeString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="mb-4">{ballot.description}</p>
              </div>

              {error && (
                <Alert className="border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-vote-green/50 bg-vote-green/10 text-vote-green dark:border-vote-green/30 dark:bg-vote-green/20">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {hasVoted ? (
                <div className="bg-vote-blue/10 dark:bg-vote-blue/20 p-4 rounded-md border border-vote-blue/30 dark:border-vote-blue/40">
                  <p className="font-medium text-vote-blue">You have already voted in this ballot.</p>
                </div>
              ) : isExpired ? (
                <div className="bg-vote-red/10 dark:bg-vote-red/20 p-4 rounded-md border border-vote-red/30 dark:border-vote-red/40">
                  <p className="font-medium text-vote-red">This ballot has ended and is no longer accepting votes.</p>
                </div>
              ) : (
                <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption}>
                  <div className="space-y-3">
                    {ballot.options.map((option, index) => {
                      // Cycle through colors for each option
                      const colorClasses = [
                        "border-vote-purple text-vote-purple bg-vote-purple/5",
                        "border-vote-blue text-vote-blue bg-vote-blue/5",
                        "border-vote-teal text-vote-teal bg-vote-teal/5",
                        "border-vote-green text-vote-green bg-vote-green/5",
                        "border-vote-orange text-vote-orange bg-vote-orange/5",
                      ]

                      const colorIndex = index % colorClasses.length

                      return (
                        <div
                          key={index}
                          className={`flex items-center space-x-2 rounded-md border p-4 transition-all duration-200 hover:shadow-sm ${
                            selectedOption === option ? colorClasses[colorIndex] : ""
                          }`}
                        >
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer font-medium">
                            {option}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </RadioGroup>
              )}
            </CardContent>
            <CardFooter>
              {canVote && (
                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || submitting}
                  className="w-full bg-vote-purple hover:bg-vote-purple/90"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Vote...
                    </>
                  ) : (
                    "Submit Vote"
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
