"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useWallet } from "@/hooks/use-wallet"
import { getVotingContract, VOTING_CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contracts"
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function CreateBallotPage() {
  const router = useRouter()
  const { isConnected, provider, signer } = useWallet()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [duration, setDuration] = useState("1")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)

  // Check if we're on the correct network
  useEffect(() => {
    const checkNetwork = async () => {
      if (provider) {
        try {
          const network = await provider.getNetwork()
          if (network.chainId !== SEPOLIA_CHAIN_ID) {
            setNetworkError(
              `Please connect to the Sepolia Test Network. Current network: ${network.name || network.chainId.toString()}`,
            )
          } else {
            setNetworkError(null)
            const code = await provider.getCode(VOTING_CONTRACT_ADDRESS)
            if (!code || code === "0x") {
              setError(`No contract found at address ${VOTING_CONTRACT_ADDRESS}`)
            } else {
              setError(null)
            }
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

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    const newOptions = [...options]
    newOptions.splice(index, 1)
    setOptions(newOptions)
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!title.trim()) {
      setError("Please enter a ballot title")
      return
    }

    if (!description.trim()) {
      setError("Please enter a ballot description")
      return
    }

    const validOptions = options.filter((opt) => opt.trim() !== "")
    if (validOptions.length < 2) {
      setError("Please enter at least two options")
      return
    }

    if (!signer) {
      setError("Wallet not connected")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const contract = getVotingContract(signer)

      // Convert duration from days to seconds
      const durationInSeconds = Number.parseInt(duration) * 24 * 60 * 60

      // Create ballot transaction
      const tx = await contract.createBallot(title, description, validOptions, durationInSeconds)

      await tx.wait()

      // Redirect to vote page
      router.push("/vote")
    } catch (error: any) {
      console.error("Error creating ballot:", error)
      setError(error.message || "Failed to create ballot. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="gradient-bg min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center p-8 bg-white/80 dark:bg-card/80 backdrop-blur-sm rounded-xl border border-vote-purple/20 dark:border-vote-purple/30 card-hover">
            <h1 className="text-2xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="mb-6">Please connect your wallet to create a new ballot.</p>
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

  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 gradient-text text-center">Create a New Ballot</h1>

          {error && (
            <Alert className="mb-6 border-vote-red/50 bg-vote-red/10 text-vote-red dark:border-vote-red/30 dark:bg-vote-red/20">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="card-hover border-vote-blue/20 dark:border-vote-blue/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-vote-blue">Ballot Details</CardTitle>
                <CardDescription>Fill in the information below to create a new voting ballot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-vote-purple">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter ballot title"
                    required
                    className="border-vote-purple/20 focus:border-vote-purple/50 focus:ring-vote-purple/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-vote-blue">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide details about this ballot"
                    rows={4}
                    required
                    className="border-vote-blue/20 focus:border-vote-blue/50 focus:ring-vote-blue/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-vote-teal">Options</Label>
                  <div className="space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          required
                          className="border-vote-teal/20 focus:border-vote-teal/50 focus:ring-vote-teal/50"
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index)}
                            className="text-vote-red hover:text-vote-red/80 hover:bg-vote-red/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 border-vote-green text-vote-green hover:bg-vote-green/10 hover:text-vote-green"
                    onClick={addOption}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-vote-orange">
                    Duration
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="border-vote-orange/20 focus:border-vote-orange/50 focus:ring-vote-orange/50">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-vote-purple via-vote-blue to-vote-teal hover:opacity-90 transition-opacity"
                  disabled={submitting || !!error}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Ballot...
                    </>
                  ) : (
                    "Create Ballot"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
