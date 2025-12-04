"use client"

import { useState, useCallback, useMemo } from "react"
import { FaultEngine, type FaultType } from "@/lib/fault-engine"

export function useFaultSimulation() {
  const engine = useMemo(() => new FaultEngine(), [])

  const [faults, setFaults] = useState<Map<number, FaultType>>(new Map())
  const [faultLog, setFaultLog] = useState<any[]>([])

  const injectFault = useCallback(
    (nodeId: number, faultType: FaultType) => {
      const success = engine.injectFault(nodeId, faultType)
      if (success) {
        setFaults((prev) => new Map(prev).set(nodeId, faultType))
        setFaultLog(engine.getFaultLog())
      }
      return success
    },
    [engine],
  )

  const removeFault = useCallback(
    (nodeId: number) => {
      const success = engine.removeFault(nodeId)
      if (success) {
        setFaults((prev) => {
          const newMap = new Map(prev)
          newMap.delete(nodeId)
          return newMap
        })
        setFaultLog(engine.getFaultLog())
      }
      return success
    },
    [engine],
  )

  const canNodeReceive = useCallback(
    (nodeId: number, message: any) => {
      return engine.canNodeReceiveMessage(nodeId, message)
    },
    [engine],
  )

  const canNodeSend = useCallback(
    (nodeId: number) => {
      return engine.canNodeSendMessage(nodeId)
    },
    [engine],
  )

  const processMessage = useCallback(
    (fromNodeId: number, toNodeId: number, message: any) => {
      // Check if sender can send
      if (!engine.canNodeSendMessage(fromNodeId)) {
        return null
      }

      // Check if receiver can receive
      if (!engine.canNodeReceiveMessage(toNodeId, message)) {
        return null
      }

      // Apply byzantine fault if sender is byzantine
      let processedMessage = message
      const senderFault = engine.getFaultStatus(fromNodeId)
      if (senderFault?.faultType === "byzantine") {
        processedMessage = engine.handleByzantineFault(fromNodeId, message, {})
      }

      return processedMessage
    },
    [engine],
  )

  return {
    faults,
    faultLog,
    injectFault,
    removeFault,
    canNodeReceive,
    canNodeSend,
    processMessage,
    engine,
  }
}
