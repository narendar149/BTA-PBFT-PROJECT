"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSharedConsensus } from "@/contexts/consensus-context"

export function ConfigurationPanel() {
  const { nodeCount, byzantineCount, setNodeCount, setByzantineCount, startSimulation } = useSharedConsensus()

  const maxByzantine = Math.floor((nodeCount - 1) / 3)
  const honestNodes = nodeCount - byzantineCount
  const minNodes = 4

  const canIncrementNodes = nodeCount < 10
  const canDecrementNodes = nodeCount > minNodes
  const canIncrementByzantine = byzantineCount < maxByzantine
  const canDecrementByzantine = byzantineCount > 0

  return (
    <Card className="border border-border bg-card mt-8">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2">
          <span>⚙️</span> Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Number of Nodes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Number of Nodes</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => canDecrementNodes && setNodeCount(nodeCount - 1)}
              disabled={!canDecrementNodes}
              className="p-2 rounded border border-border hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease nodes"
            >
              ▼
            </button>
            <input
              type="text"
              value={nodeCount}
              readOnly
              className="flex-1 px-4 py-2 bg-slate-900 border border-border rounded text-center font-semibold"
            />
            <button
              onClick={() => canIncrementNodes && setNodeCount(nodeCount + 1)}
              disabled={!canIncrementNodes}
              className="p-2 rounded border border-border hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase nodes"
            >
              ▲
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Need 3f + 1 nodes minimum (currently {minNodes})</p>
        </div>

        {/* Byzantine Nodes (Faults) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Byzantine Nodes (Faults)</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => canDecrementByzantine && setByzantineCount(byzantineCount - 1)}
              disabled={!canDecrementByzantine}
              className="p-2 rounded border border-border hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease byzantine nodes"
            >
              ▼
            </button>
            <input
              type="text"
              value={byzantineCount}
              readOnly
              className="flex-1 px-4 py-2 bg-slate-900 border border-border rounded text-center font-semibold"
            />
            <button
              onClick={() => canIncrementByzantine && setByzantineCount(byzantineCount + 1)}
              disabled={!canIncrementByzantine}
              className="p-2 rounded border border-border hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase byzantine nodes"
            >
              ▲
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Max Tolerable: {maxByzantine} | Honest Nodes: {honestNodes}
          </p>
        </div>

        {/* Start Simulation Button */}
        <Button
          onClick={startSimulation}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-6 text-lg rounded-lg transition-colors"
        >
          <span className="mr-2">▶</span> Node initialization
        </Button>

        {/* Safety Information */}
        <div className="bg-slate-900 border border-border rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium text-yellow-400">Safety Requirements:</p>
          <p className="text-xs text-muted-foreground">
            For Byzantine Fault Tolerance: N &gt; 3f (where f is max faulty nodes)
          </p>
          <p className="text-xs text-muted-foreground">
            Current: {nodeCount} &gt; 3 × {maxByzantine} ✓
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
