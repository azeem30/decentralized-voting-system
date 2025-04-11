import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, CheckCircle, Vote } from "lucide-react"

export default function Home() {
  return (
    <div className="gradient-bg min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl gradient-text">
              Decentralized Voting System
            </h1>
            <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
              Secure, transparent, and tamper-proof voting powered by blockchain technology.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-vote-purple hover:bg-vote-purple/90">
              <Link href="/vote">
                Start Voting <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-vote-purple text-vote-purple hover:bg-vote-purple/10"
            >
              <Link href="/create">Create Ballot</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          <Card className="card-hover border-vote-purple/20 dark:border-vote-purple/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-vote-purple/10 dark:bg-vote-purple/20 flex items-center justify-center mb-4">
                <Vote className="h-6 w-6 text-vote-purple" />
              </div>
              <CardTitle className="text-vote-purple">Secure Voting</CardTitle>
              <CardDescription>
                Your vote is securely recorded on the blockchain, ensuring it cannot be altered or deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Each vote is cryptographically signed with your wallet, providing a verifiable record of your
                participation while maintaining anonymity.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-vote-blue/20 dark:border-vote-blue/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-vote-blue/10 dark:bg-vote-blue/20 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-vote-blue" />
              </div>
              <CardTitle className="text-vote-blue">Transparent Results</CardTitle>
              <CardDescription>All votes are publicly verifiable while maintaining voter privacy.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Anyone can independently verify the vote count and results without revealing individual voting choices.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-vote-teal/20 dark:border-vote-teal/30 bg-white/80 dark:bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-vote-teal/10 dark:bg-vote-teal/20 flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-vote-teal"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <CardTitle className="text-vote-teal">Decentralized Control</CardTitle>
              <CardDescription>No central authority controls the voting process or results.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                The voting system runs on a distributed network, eliminating the risk of manipulation by any single
                entity.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
