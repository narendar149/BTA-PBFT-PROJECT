"use client"

import { useState } from "react"
import { useSharedConsensus } from "@/contexts/consensus-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

type FaultType = "crash" | "byzantine" | "omission"

export function FaultSimulator() {
  const { injectFault, nodes, byzantineCount, clearAllFaults } = useSharedConsensus()
  const [selectedFaults, setSelectedFaults] = useState<Map<string, FaultType>>(new Map())

  const injectedFaults = new Map<string, FaultType>()
  const currentFaultyCount = nodes.filter((n) => n.faulty).length

  nodes.forEach((node) => {
    if (node.faulty && node.faultType) {
      injectedFaults.set(`${node.id}-${node.faultType}`, node.faultType)
    }
  })

  const toggleFault = (nodeId: number, faultType: FaultType) => {
    const key = `${nodeId}-${faultType}`

    setSelectedFaults((prev) => {
      const newMap = new Map(prev)

      // Remove all faults for this node
      Array.from(newMap.keys()).forEach((k) => {
        if (k.startsWith(`${nodeId}-`)) {
          newMap.delete(k)
        }
      })

      // Add the selected fault (toggle off if already selected)
      if (!newMap.has(key)) {
        newMap.set(key, faultType)
      }

      return newMap
    })
  }

  const handleInjectFaults = () => {
    nodes.forEach((node) => {
      if (node.faulty) {
        injectFault(node.id, "crash") // Clear by injecting a dummy fault that we'll override
      }
    })

    // Now inject the selected faults
    selectedFaults.forEach((faultType, key) => {
      const nodeId = Number.parseInt(key.split("-")[0])
      injectFault(nodeId, faultType)
    })

    setSelectedFaults(new Map())
  }

  const handleClearFaults = () => {
    clearAllFaults()
    setSelectedFaults(new Map())
  }

  const hasFault = (nodeId: number, faultType: FaultType) => {
    return selectedFaults.has(`${nodeId}-${faultType}`)
  }

  const isInjected = (nodeId: number, faultType: FaultType) => {
    return injectedFaults.has(`${nodeId}-${faultType}`)
  }

  const maxFaultsAllowed = Math.floor((nodes.length - 1) / 3)
  const faultCount = selectedFaults.size
  const totalFaults = currentFaultyCount + faultCount

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card border-red-900/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Fault Injection Controls
          </CardTitle>
          <CardDescription>
            Select nodes and fault types to inject. Maximum {maxFaultsAllowed} faults can be tolerated (f = ⌊(N-1)/3⌋)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fault type info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {faultTypes.map((fault) => {
              const Icon = fault.icon
              return (
                <div key={fault.id} className="border border-border rounded-lg p-4 bg-slate-950">
                  <div className="flex items-start gap-3 mb-2">
                    <Icon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-sm">{fault.label}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{fault.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Node selection */}
          <div className="space-y-3">
            <h3 className="font-bold">Select Nodes and Faults</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className={`border rounded-lg p-4 ${
                    node.faulty ? "bg-red-950 border-red-700" : "bg-slate-950 border-border"
                  }`}
                >
                  <h4 className="font-bold mb-3 text-sm">
                    Node {node.id} {node.role === "leader" && "(Leader)"}
                    {node.faulty && <span className="ml-2 text-red-400 text-xs">✗ FAULTY</span>}
                  </h4>
                  <div className="space-y-2">
                    {faultTypes.map((fault) => {
                      const isSelected = hasFault(node.id, fault.id)
                      const alreadyInjected = isInjected(node.id, fault.id)
                      return (
                        <button
                          key={fault.id}
                          onClick={() => !alreadyInjected && toggleFault(node.id, fault.id)}
                          disabled={alreadyInjected}
                          className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            alreadyInjected
                              ? "bg-red-600/60 text-white border border-red-500 opacity-60 cursor-not-allowed"
                              : isSelected
                                ? "bg-red-600/80 text-white border border-red-400"
                                : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600"
                          }`}
                        >
                          {alreadyInjected ? "✓ " : isSelected ? "○ " : ""}
                          {fault.label}
                          {alreadyInjected && <span className="ml-1 text-xs">(injected)</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Injected: {currentFaultyCount} | Pending: {faultCount} | Total: {totalFaults}
            </p>
            {totalFaults > maxFaultsAllowed && (
              <div className="rounded-lg p-4 border bg-red-950/30 border-red-900/50">
                <p className="text-sm text-red-400">
                  ⚠️ Warning: {totalFaults} faults exceed the fault tolerance limit ({maxFaultsAllowed}). Consensus may
                  fail.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleInjectFaults}
              disabled={faultCount === 0}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Inject {faultCount > 0 ? `${faultCount} Selected ` : ""}Fault{faultCount !== 1 ? "s" : ""}
            </Button>
            <Button
              onClick={handleClearFaults}
              disabled={currentFaultyCount === 0 && faultCount === 0}
              className="flex-1 bg-slate-700 hover:bg-slate-600"
            >
              Clear All Faults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fault details */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Fault Details</CardTitle>
          <CardDescription>Understanding different fault types in PBFT</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-bold text-red-500">Crash Fault</h4>
              <p className="text-sm text-muted-foreground mt-1">
                A node stops responding and cannot participate in consensus
              </p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h4 className="font-bold text-orange-500">Byzantine Fault</h4>
              <p className="text-sm text-muted-foreground mt-1">A node sends conflicting or malicious messages</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-bold text-yellow-500">Omission Fault</h4>
              <p className="text-sm text-muted-foreground mt-1">A node receives messages but fails to send responses</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const faultTypes: Array<{ id: FaultType; label: string; description: string; icon: any }> = [
  {
    id: "crash",
    label: "Crash Fault",
    description: "Node stops responding and cannot participate in consensus",
    icon: AlertCircle,
  },
  {
    id: "byzantine",
    label: "Byzantine Fault",
    description: "Node sends conflicting or malicious messages",
    icon: AlertTriangle,
  },
  {
    id: "omission",
    label: "Omission Fault",
    description: "Node receives messages but fails to send responses",
    icon: CheckCircle,
  },
]
