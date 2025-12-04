"use client"

import { useState, useCallback, useEffect } from "react"

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

export interface ConsensusState {
  nodes: Node[]
  messages: Message[]
  messageLog: Array<{ timestamp: string; from: string; to: string; type: string; status?: string }>
  status: string
  round: number
  committedBlocks: number
  activeNodes: number
}

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

export function useConsensus() {
  const [state, setState] = useState<ConsensusState>({
    nodes: [],
    messages: [],
    messageLog: [],
    status: "idle",
    round: 0,
    committedBlocks: 0,
    activeNodes: NODES_COUNT,
  })

  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    const positions = getNodeCirclePositions(NODES_COUNT, 300, 200, 150)
    const initialNodes: Node[] = positions.map((pos, i) => ({
      id: i,
      x: pos.x,
      y: pos.y,
      role: i === 0 ? "leader" : "replica",
      status: "idle",
      faulty: false,
    }))
    setState((prev) => ({ ...prev, nodes: initialNodes, activeNodes: NODES_COUNT }))
  }, [])

  const executeStep = useCallback((stepIndex: number) => {
    setIsRunning(true)

    setState((prev) => {
      const newState = { ...prev }
      const timestamp = new Date().toLocaleTimeString()
      const maxFaults = Math.floor((NODES_COUNT - 1) / 3)
      const activeFaultyCount = newState.nodes.filter((n) => n.faulty).length

      // Check if consensus is safe
      if (activeFaultyCount > maxFaults) {
        newState.status = "unsafe"
        return newState
      }

      switch (stepIndex) {
        case 0: // Initialization
          newState.status = "initializing"
          newState.round = 1
          newState.messageLog.push({
            timestamp,
            from: "System",
            to: "Network",
            type: "Initialize",
          })
          newState.nodes = newState.nodes.map((node, i) => ({
            ...node,
            status: "idle",
          }))
          break

        case 1: // Pre-Prepare Phase
          newState.status = "pre-prepare"
          newState.nodes = newState.nodes.map((node) => ({
            ...node,
            status: node.id === 0 ? "pre-prepare" : "idle",
          }))

          // Leader sends to all replicas
          for (let i = 1; i < NODES_COUNT; i++) {
            const targetNode = newState.nodes[i]
            if (!targetNode.faulty || targetNode.faultType === "omission") {
              newState.messageLog.push({
                timestamp,
                from: `Node 0 (Leader)`,
                to: `Node ${i}`,
                type: "PRE-PREPARE",
                status: targetNode.faulty ? "faulty" : "ok",
              })
            }
          }
          break

        case 2: // Prepare Phase
          newState.status = "prepare"
          newState.nodes = newState.nodes.map((node) => ({
            ...node,
            status: "prepare",
          }))

          // All replicas send prepare messages
          for (let i = 0; i < NODES_COUNT; i++) {
            if (newState.nodes[i].faulty) continue
            for (let j = 0; j < NODES_COUNT; j++) {
              if (i !== j) {
                const targetNode = newState.nodes[j]
                if (targetNode.faultType !== "omission" || !targetNode.faulty) {
                  newState.messageLog.push({
                    timestamp,
                    from: `Node ${i}`,
                    to: `Node ${j}`,
                    type: "PREPARE",
                  })
                }
              }
            }
          }
          break

        case 3: // Commit Phase
          newState.status = "commit"
          newState.nodes = newState.nodes.map((node) => ({
            ...node,
            status: "commit",
          }))

          // All nodes send commit messages (faultyByantine nodes send conflicting)
          for (let i = 0; i < NODES_COUNT; i++) {
            for (let j = 0; j < NODES_COUNT; j++) {
              if (i !== j) {
                const fromNode = newState.nodes[i]
                const toNode = newState.nodes[j]

                if (fromNode.faulty && fromNode.faultType === "crash") continue

                newState.messageLog.push({
                  timestamp,
                  from: `Node ${i}`,
                  to: `Node ${j}`,
                  type: "COMMIT",
                  status: fromNode.faulty && fromNode.faultType === "byzantine" ? "conflicting" : "ok",
                })
              }
            }
          }
          break

        case 4: // Consensus Reached
          newState.status = "committed"
          newState.committedBlocks += 1
          newState.nodes = newState.nodes.map((node) => ({
            ...node,
            status: "committed",
          }))
          newState.messageLog.push({
            timestamp,
            from: "Network",
            to: "Blockchain",
            type: "Block Committed",
          })
          break
      }

      return newState
    })

    setTimeout(() => setIsRunning(false), 500)
  }, [])

  const injectFault = useCallback((nodeId: number, faultType: "crash" | "byzantine" | "omission") => {
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
      const newActiveNodes = NODES_COUNT - activeFaultyNodes
      const maxFaults = Math.floor((NODES_COUNT - 1) / 3)

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
  }, [])

  return {
    ...state,
    executeStep,
    injectFault,
    isRunning,
  }
}
