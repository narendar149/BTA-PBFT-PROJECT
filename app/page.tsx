"use client"
import { Dashboard } from "@/components/dashboard"
import { NetworkVisualization } from "@/components/network-visualization"
import { ConsensusStepper } from "@/components/consensus-stepper"
import { MessageFlow } from "@/components/message-flow"
import { FaultSimulator } from "@/components/fault-simulator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfigurationPanel } from "@/components/configuration-panel"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-pretty mb-3 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              PBFT Consensus Simulator
            </h1>
            <p className="text-lg text-muted-foreground">
              Interactive visualization of Byzantine Fault Tolerant consensus algorithm with real-time fault injection
              and simulation
            </p>
          </div>
        </div>
      </div>

      {/* Main Content - Single unified page */}
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Dashboard */}
        <Dashboard />

        {/* Configuration Panel */}
        <ConfigurationPanel />

        {/* Network Topology */}
        <NetworkVisualization />

        <FaultSimulator />

        {/* Divider */}
        <div className="border-t border-border my-8" />

        <div>
          <h2 className="text-3xl font-bold mb-6">Step-by-Step Consensus Walkthrough</h2>
          <ConsensusStepper />
        </div>

        {/* Message Flow / Consensus Flow */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold mb-6">Real-Time Consensus Message Flow</h2>
          <MessageFlow />
        </div>
      </div>

      {/* Footer with additional info */}
      <div className="border-t border-border bg-slate-950 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">What is PBFT?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  Practical Byzantine Fault Tolerance (PBFT) is a state machine replication algorithm that can tolerate
                  up to f malicious nodes in a network of n nodes, where n {">"} 3f.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Key Features</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>✓ Safety: Correct nodes always agree</p>
                <p>✓ Liveness: Progress is always made</p>
                <p>✓ Optimistic: 3 message delays in common case</p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Fault Tolerance</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Tolerates up to: f {"<"} N/3</p>
                <p>With N=4 nodes: f {"<"} 1.33</p>
                <p>Max Byzantine nodes: 1</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
