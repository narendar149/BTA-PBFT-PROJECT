"use client"

import { createContext, useContext, type ReactNode, useState, useCallback, useEffect } from "react"

// Types
export interface Node {
  id: number
  x: number
  y: number
  role: "leader" | "replica"
  status: "idle" | "pre-prepare" | "prepare" | "commit" | "committed"
  faulty: boolean
  faultType?: "crash" | "byzantine" | "omission"
}

export interface Message {
  id: string
  from: number
  to: number
  type: "proposal" | "vote" | "acknowledgment"
  status: "pending" | "received" | "processed"
  timestamp: number
}

export interface ConsensusContextType {
  nodes: Node[]
  messages: Message[]
  messageLog: Array<{ timestamp: string; from: string; to: string; type: string; status?: string }>
  status: string
  round: number
  committedBlocks: number
  activeNodes: number
  nodeCount: number
  byzantineCount: number
  setNodeCount: (count: number) => void
  setByzantineCount: (count: number) => void
  startSimulation: () => void
  executeStep: (stepIndex: number) => void
  injectFault: (nodeId: number, faultType: "crash" | "byzantine" | "omission") => void
  clearAllFaults: () => void
  isRunning: boolean
}

const ConsensusContext = createContext<ConsensusContextType | undefined>(undefined)

const NODES_COUNT = 4

function getNodeCirclePositions(count: number, centerX: number, centerY: number, radius: number) {
  return Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })
}

export function ConsensusProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<
    Omit<
      ConsensusContextType,
      | "executeStep"
      | "injectFault"
      | "clearAllFaults"
      | "isRunning"
      | "setNodeCount"
      | "setByzantineCount"
      | "startSimulation"
    >
  >({
    nodes: [],
    messages: [],
    messageLog: [],
    status: "idle",
    round: 0,
    committedBlocks: 0,
    activeNodes: NODES_COUNT,
  })

  const [isRunning, setIsRunning] = useState(false)
  const [nodeCount, setNodeCountState] = useState(NODES_COUNT)
  const [byzantineCount, setByzantineCountState] = useState(0)

  useEffect(() => {
    const positions = getNodeCirclePositions(nodeCount, 300, 200, 150)
    const initialNodes: Node[] = positions.map((pos, i) => ({
      id: i,
      x: pos.x,
      y: pos.y,
      role: i === 0 ? "leader" : "replica",
      status: "idle",
      faulty: false,
    }))
    setState((prev) => ({ ...prev, nodes: initialNodes, activeNodes: nodeCount }))
  }, [nodeCount])

  const setNodeCount = useCallback(
    (count: number) => {
      const minNodes = 4
      const maxNodes = 10
      if (count >= minNodes && count <= maxNodes) {
        setNodeCountState(count)
        // Reset byzantine count if it exceeds new max
        const maxByzantine = Math.floor((count - 1) / 3)
        if (byzantineCount > maxByzantine) {
          setByzantineCountState(maxByzantine)
        }
      }
    },
    [byzantineCount],
  )

  const setByzantineCount = useCallback(
    (count: number) => {
      const maxByzantine = Math.floor((nodeCount - 1) / 3)
      if (count >= 0 && count <= maxByzantine) {
        setByzantineCountState(count)
      }
    },
    [nodeCount],
  )

  const startSimulation = useCallback(() => {
    setState((prev) => {
      const newNodes = prev.nodes.map((node) => ({
        ...node,
        faulty: false,
        faultType: undefined,
      }))

      return {
        ...prev,
        nodes: newNodes,
        status: "ready",
      }
    })
  }, [byzantineCount])

  const executeStep = useCallback(
    (stepIndex: number) => {
      setIsRunning(true)

      setState((prev) => {
        const newState = { ...prev }
        const timestamp = new Date().toLocaleTimeString()
        const maxFaults = Math.floor((nodeCount - 1) / 3)
        const activeFaultyCount = newState.nodes.filter((n) => n.faulty).length

        if (activeFaultyCount > maxFaults) {
          newState.status = "unsafe"
          return newState
        }

        switch (stepIndex) {
          case 0:
            newState.status = "initializing"
            newState.round = 1
            newState.messageLog.push({
              timestamp,
              from: "System",
              to: "Network",
              type: "Initialize",
            })
            newState.nodes = newState.nodes.map((node) => ({
              ...node,
              status: "idle",
            }))
            break

          case 1:
            newState.status = "pre-prepare"
            newState.nodes = newState.nodes.map((node) => ({
              ...node,
              status: node.id === 0 ? "pre-prepare" : "idle",
            }))

            for (let i = 1; i < nodeCount; i++) {
              const targetNode = newState.nodes[i]
              const leaderNode = newState.nodes[0]

              // If leader is crashed, no messages sent
              if (leaderNode.faulty && leaderNode.faultType === "crash") {
                newState.messageLog.push({
                  timestamp,
                  from: `Node 0 (Leader)`,
                  to: `Node ${i}`,
                  type: "PRE-PREPARE",
                  status: "blocked - leader crashed",
                })
                continue
              }

              // If target has omission fault, it won't receive outgoing (but receives incoming)
              if (targetNode.faulty && targetNode.faultType === "omission") {
                newState.messageLog.push({
                  timestamp,
                  from: `Node 0 (Leader)`,
                  to: `Node ${i}`,
                  type: "PRE-PREPARE",
                  status: "omitted - target cannot send responses",
                })
              } else if (targetNode.faulty && targetNode.faultType === "crash") {
                // Crash node doesn't receive or process
                newState.messageLog.push({
                  timestamp,
                  from: `Node 0 (Leader)`,
                  to: `Node ${i}`,
                  type: "PRE-PREPARE",
                  status: "blocked - target crashed",
                })
              } else if (targetNode.faulty && targetNode.faultType === "byzantine") {
                // Byzantine receives normally
                newState.messageLog.push({
                  timestamp,
                  from: `Node 0 (Leader)`,
                  to: `Node ${i}`,
                  type: "PRE-PREPARE",
                  status: "received - will act maliciously",
                })
              } else {
                // Normal node
                newState.messageLog.push({
                  timestamp,
                  from: `Node 0 (Leader)`,
                  to: `Node ${i}`,
                  type: "PRE-PREPARE",
                  status: "ok",
                })
              }
            }
            break

          case 2:
            newState.status = "prepare"
            newState.nodes = newState.nodes.map((node) => ({
              ...node,
              status: "prepare",
            }))

            for (let i = 0; i < nodeCount; i++) {
              const sourceNode = newState.nodes[i]

              // Crash nodes don't send anything
              if (sourceNode.faulty && sourceNode.faultType === "crash") {
                continue
              }

              // Omission nodes don't send anything
              if (sourceNode.faulty && sourceNode.faultType === "omission") {
                continue
              }

              for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue

                const targetNode = newState.nodes[j]

                // Byzantine nodes send conflicting messages
                if (sourceNode.faulty && sourceNode.faultType === "byzantine") {
                  newState.messageLog.push({
                    timestamp,
                    from: `Node ${i}`,
                    to: `Node ${j}`,
                    type: "PREPARE",
                    status: "conflicting - byzantine source",
                  })
                } else if (targetNode.faulty && targetNode.faultType === "crash") {
                  // Target is crashed, can't receive
                  newState.messageLog.push({
                    timestamp,
                    from: `Node ${i}`,
                    to: `Node ${j}`,
                    type: "PREPARE",
                    status: "blocked - target crashed",
                  })
                } else {
                  // Normal message
                  newState.messageLog.push({
                    timestamp,
                    from: `Node ${i}`,
                    to: `Node ${j}`,
                    type: "PREPARE",
                    status: "ok",
                  })
                }
              }
            }
            break

          case 3:
            newState.status = "commit"
            newState.nodes = newState.nodes.map((node) => ({
              ...node,
              status: "commit",
            }))

            for (let i = 0; i < nodeCount; i++) {
              const fromNode = newState.nodes[i]

              // Crash nodes don't send
              if (fromNode.faulty && fromNode.faultType === "crash") {
                continue
              }

              // Omission nodes don't send
              if (fromNode.faulty && fromNode.faultType === "omission") {
                continue
              }

              for (let j = 0; j < nodeCount; j++) {
                if (i === j) continue

                const toNode = newState.nodes[j]

                let status = "ok"

                // Byzantine sends conflicting
                if (fromNode.faulty && fromNode.faultType === "byzantine") {
                  status = "conflicting - byzantine node"
                } else if (toNode.faulty && toNode.faultType === "crash") {
                  // Target crashed
                  status = "blocked - target crashed"
                } else if (toNode.faulty && toNode.faultType === "byzantine") {
                  // Receiving from byzantine (already handled in receive logic)
                  status = "ok - target will misinterpret"
                }

                newState.messageLog.push({
                  timestamp,
                  from: `Node ${i}`,
                  to: `Node ${j}`,
                  type: "COMMIT",
                  status,
                })
              }
            }
            break

          case 4:
            newState.status = "committed"
            const nonFaultyNodes = newState.nodes.filter((n) => !n.faulty).length
            const quorumRequired = Math.floor((nodeCount - 1) / 3) + 1

            if (nonFaultyNodes >= quorumRequired) {
              newState.committedBlocks += 1
              newState.nodes = newState.nodes.map((node) => {
                if (!node.faulty || node.faultType !== "crash") {
                  return { ...node, status: "committed" }
                }
                return node
              })
              newState.messageLog.push({
                timestamp,
                from: "Network",
                to: "Blockchain",
                type: "Block Committed",
                status: `Quorum reached: ${nonFaultyNodes}/${quorumRequired} nodes`,
              })
            } else {
              newState.status = "unsafe"
              newState.messageLog.push({
                timestamp,
                from: "Network",
                to: "Blockchain",
                type: "Block Commit Failed",
                status: `Insufficient quorum: ${nonFaultyNodes} < ${quorumRequired}`,
              })
            }
            break
        }

        return newState
      })

      setTimeout(() => setIsRunning(false), 500)
    },
    [nodeCount],
  )

  const injectFault = useCallback(
    (nodeId: number, faultType: "crash" | "byzantine" | "omission") => {
      setState((prev) => {
        const newNodes = prev.nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              faulty: true,
              faultType,
            }
          }
          return node
        })

        const activeFaultyNodes = newNodes.filter((n) => n.faulty).length
        const newActiveNodes = nodeCount - activeFaultyNodes
        const maxFaults = Math.floor((nodeCount - 1) / 3)

        const timestamp = new Date().toLocaleTimeString()
        const newLog = [
          ...prev.messageLog,
          {
            timestamp,
            from: "System",
            to: `Node ${nodeId}`,
            type: `${faultType.toUpperCase()} Fault Injected`,
            status: activeFaultyNodes > maxFaults ? "CRITICAL" : "ok",
          },
        ]

        return {
          ...prev,
          nodes: newNodes,
          activeNodes: newActiveNodes,
          messageLog: newLog,
          status: activeFaultyNodes > maxFaults ? "unsafe" : "safe",
        }
      })
    },
    [nodeCount],
  )

  const clearAllFaults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) => ({
        ...node,
        faulty: false,
        faultType: undefined,
      })),
      messageLog: [
        ...prev.messageLog,
        {
          timestamp: new Date().toLocaleTimeString(),
          from: "System",
          to: "Network",
          type: "All Faults Cleared",
        },
      ],
      status: "safe",
      activeNodes: prev.nodes.length,
    }))
  }, [])

  const value: ConsensusContextType = {
    ...state,
    nodeCount,
    byzantineCount,
    setNodeCount,
    setByzantineCount,
    startSimulation,
    executeStep,
    injectFault,
    clearAllFaults,
    isRunning,
  }

  return <ConsensusContext.Provider value={value}>{children}</ConsensusContext.Provider>
}

export function useSharedConsensus() {
  const context = useContext(ConsensusContext)
  if (!context) {
    throw new Error("useSharedConsensus must be used within ConsensusProvider")
  }
  return context
}
