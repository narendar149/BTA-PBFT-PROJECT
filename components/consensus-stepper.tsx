"use client"

import { useState } from "react"
import { useSharedConsensus } from "@/contexts/consensus-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Play, RotateCcw, Info } from "lucide-react"

const STEPS = [
  {
    title: "Network Initialization",
    description:
      "Network is initialized with N nodes. A leader (primary) is elected and prepares the first block proposal.",
    details: [
      "Total nodes initialized: 4",
      "Leader elected: Node 0 (Primary)",
      "Faulty nodes allowed: 1 (f = ⌊(N-1)/3⌋)",
      "Quorum required: 3 nodes (f + 1)",
      "Consensus threshold: 2f + 1 = 3 nodes",
    ],
    formula: "f = ⌊(N-1)/3⌋ where N = 4, so f = 1",
  },
  {
    title: "Pre-Prepare Phase",
    description:
      "The leader (primary) broadcasts a PRE-PREPARE message containing the proposed block to all other replicas.",
    details: [
      "Leader Node 0 prepares a new block for consensus round 1",
      "Block includes transaction data and a unique hash",
      "Leader broadcasts: ⟨PRE-PREPARE, v=0, n=1, D, d⟩",
      "v = current view number",
      "n = sequence number",
      "D = block digest",
      "d = block data",
    ],
    formula: "Message format: ⟨PRE-PREPARE, v, n, D⟩",
  },
  {
    title: "Prepare Phase",
    description:
      "Each replica validates the PRE-PREPARE message and broadcasts a PREPARE message to all other replicas.",
    details: [
      "Replicas 1, 2, 3 receive PRE-PREPARE message",
      "Each replica validates: message authenticity, digest correctness, view/sequence match",
      "Each replica broadcasts: ⟨PREPARE, v=0, n=1, D, i⟩",
      "i = sending replica ID",
      "Replicas collect PREPARE messages from all peers",
      "Consensus rule: prepared if received 2f PREPARE messages = 2 messages",
    ],
    formula: "Prepared condition: 2f messages received",
  },
  {
    title: "Commit Phase",
    description: "After receiving 2f matching PREPARE messages, each replica broadcasts a COMMIT message.",
    details: [
      "Each replica waits for 2f matching PREPARE messages",
      "Upon reaching prepared state, broadcasts: ⟨COMMIT, v=0, n=1, D, i⟩",
      "Replicas collect COMMIT messages from all peers",
      "Consensus rule: committed if received 2f+1 COMMIT messages = 3 messages",
      "This ensures agreement on block ordering",
      "Safety guarantee: no two different blocks committed at same sequence",
    ],
    formula: "Committed condition: 2f+1 messages received",
  },
  {
    title: "Consensus Finalization",
    description:
      "After receiving 2f+1 matching COMMIT messages, the block is irreversibly committed and added to the blockchain.",
    details: [
      "Block is added to local blockchain after 2f+1 confirmations",
      "Block becomes immutable and part of transaction history",
      "New consensus round begins with view 1",
      "New leader elected: Node (view mod N) = Node 1",
      "Byzantine Fault Tolerance guarantee achieved",
      "Network can tolerate up to f=1 faulty node misbehavior",
    ],
    formula: "BFT guarantee: f < N/3 (1 < 4/3 ✓)",
  },
]

export function ConsensusStepper() {
  const [currentStep, setCurrentStep] = useState(0)
  const { executeStep, isRunning } = useSharedConsensus()
  const [expandedDetails, setExpandedDetails] = useState(true)

  const step = STEPS[currentStep]

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      executeStep(currentStep)
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleReset = () => {
    setCurrentStep(0)
  }

  const handleAutoPlay = () => {
    let step = currentStep
    const interval = setInterval(() => {
      if (step < STEPS.length - 1) {
        executeStep(step)
        step++
        setCurrentStep(step)
      } else {
        clearInterval(interval)
      }
    }, 1500)
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="relative">
        <div className="flex justify-between mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => setCurrentStep(i)}>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                  i <= currentStep
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/50"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {i + 1}
              </div>
              <span className="text-xs text-center text-muted-foreground w-20 line-clamp-2">{STEPS[i].title}</span>
            </div>
          ))}
        </div>
        <div className="absolute top-6 left-6 right-6 h-1 bg-border -z-10">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <Card className="border border-border bg-card overflow-hidden">
        <CardHeader className="bg-slate-950/50 border-b border-border pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-indigo-500 font-semibold mb-1">
                Step {currentStep + 1} of {STEPS.length}
              </div>
              <CardTitle className="text-3xl">{step.title}</CardTitle>
              <CardDescription className="mt-2">{step.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Main details */}
          <div className="space-y-2">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Consensus Process Details
            </h4>
            <div className="bg-slate-950 rounded-lg p-4 space-y-2 border border-border">
              {step.details.map((detail, i) => (
                <div key={i} className="flex gap-3">
                  <div className="text-indigo-500 font-bold flex-shrink-0 text-lg">▸</div>
                  <p className="text-sm text-foreground leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formula box */}
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4">
            <h4 className="font-bold text-sm text-amber-400 mb-2 flex items-center gap-2">
              <span className="text-lg">∑</span>
              Formula & Theorem
            </h4>
            <code className="text-sm font-mono text-amber-300 block p-2 bg-slate-950 rounded border border-amber-900/30">
              {step.formula}
            </code>
          </div>

          {/* Visual representation */}
          <div className="bg-slate-950 border border-border rounded-lg p-4">
            <h4 className="font-bold text-sm mb-3 text-blue-400">Message Exchange Pattern</h4>
            <div className="space-y-2 font-mono text-xs">
              {currentStep === 1 && (
                <div className="space-y-1">
                  <div className="text-blue-400">Primary (Node 0) → All: PRE-PREPARE &lt;v, n, D&gt;</div>
                  <div className="text-gray-500 ml-4">Node 1 receives ✓</div>
                  <div className="text-gray-500 ml-4">Node 2 receives ✓</div>
                  <div className="text-gray-500 ml-4">Node 3 receives ✓</div>
                </div>
              )}
              {currentStep === 2 && (
                <div className="space-y-1">
                  <div className="text-green-400">All Replicas: PREPARE &lt;v, n, D&gt;</div>
                  <div className="text-gray-500 ml-4">Node 0 → Node 1, 2, 3</div>
                  <div className="text-gray-500 ml-4">Node 1 → Node 0, 2, 3</div>
                  <div className="text-gray-500 ml-4">Node 2 → Node 0, 1, 3</div>
                  <div className="text-gray-500 ml-4">Node 3 → Node 0, 1, 2</div>
                  <div className="text-yellow-500 mt-2">Each replica needs 2f = 2 matching PREPARE messages</div>
                </div>
              )}
              {currentStep === 3 && (
                <div className="space-y-1">
                  <div className="text-purple-400">All Replicas: COMMIT &lt;v, n, D&gt;</div>
                  <div className="text-gray-500 ml-4">Each node broadcasts to all others</div>
                  <div className="text-yellow-500 mt-2">Each replica needs 2f+1 = 3 matching COMMIT messages</div>
                  <div className="text-green-500">Once reached: Block is COMMITTED</div>
                </div>
              )}
              {currentStep === 4 && (
                <div className="space-y-1">
                  <div className="text-green-500 font-bold">CONSENSUS REACHED ✓</div>
                  <div className="text-gray-500 ml-2 mt-2">Block added to blockchain</div>
                  <div className="text-gray-500 ml-2">Network continues to next round</div>
                  <div className="text-yellow-500 ml-2">New leader: Node {(currentStep + 1) % 4}</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0} className="gap-2 bg-transparent">
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2 bg-transparent">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
        <Button variant="outline" onClick={handleAutoPlay} className="gap-2 bg-transparent">
          <Play className="w-4 h-4" />
          Auto Play
        </Button>
        <Button
          onClick={handleNext}
          disabled={currentStep === STEPS.length - 1 || isRunning}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <span>Next Step</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Theory section */}
      <Card className="border border-border bg-card border-blue-900/50 bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-400 text-lg">PBFT Algorithm Theory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h5 className="font-bold text-blue-300 mb-1">Correctness Properties:</h5>
            <ul className="space-y-1 text-muted-foreground text-xs ml-4">
              <li>
                • <span className="text-green-400">Safety:</span> Non-faulty replicas agree on committed blocks
              </li>
              <li>
                • <span className="text-green-400">Liveness:</span> New blocks are eventually committed
              </li>
              <li>
                • <span className="text-green-400">Fault Tolerance:</span> Tolerates up to f byzantine faults
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold text-blue-300 mb-1">Byzantine Fault Tolerance Bound:</h5>
            <p className="text-muted-foreground text-xs">
              f {"<"} N/3, meaning with 4 nodes we can tolerate 1 faulty node and guarantee consensus
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
