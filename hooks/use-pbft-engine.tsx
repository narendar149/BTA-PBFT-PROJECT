"use client"

import { useState, useCallback } from "react"

export interface Block {
  id: string
  timestamp: number
  data: string
  hash: string
}

export interface Vote {
  nodeId: number
  blockHash: string
  phase: "pre-prepare" | "prepare" | "commit"
}

export interface PBFTState {
  view: number
  sequence: number
  preparedBlocks: Map<string, Vote[]>
  committedBlocks: Block[]
  viewChangeInProgress: boolean
  lastBlockHash: string
}

const QUORUM_SIZE = (n: number) => Math.floor((n - 1) / 3) + 1

export function usePBFTEngine(nodeCount: number) {
  const [state, setState] = useState<PBFTState>({
    view: 0,
    sequence: 1,
    preparedBlocks: new Map(),
    committedBlocks: [],
    viewChangeInProgress: false,
    lastBlockHash: "0x0",
  })

  const createBlock = useCallback(
    (data: string): Block => {
      const timestamp = Date.now()
      const id = `block-${state.sequence}-${timestamp}`
      const hash = `0x${Math.random().toString(16).slice(2)}`
      return { id, timestamp, data, hash }
    },
    [state.sequence],
  )

  const canReachConsensus = useCallback(
    (votes: number): boolean => {
      return votes >= QUORUM_SIZE(nodeCount)
    },
    [nodeCount],
  )

  const submitBlock = useCallback(
    (block: Block): boolean => {
      if (state.viewChangeInProgress) return false

      // Count votes for this block in prepare phase
      const prepareVotes = state.preparedBlocks.get(block.hash) || []
      if (!canReachConsensus(prepareVotes.length + 1)) {
        return false
      }

      setState((prev) => ({
        ...prev,
        committedBlocks: [...prev.committedBlocks, block],
        sequence: prev.sequence + 1,
      }))

      return true
    },
    [state, canReachConsensus],
  )

  const addVote = useCallback(
    (blockHash: string, nodeId: number, phase: "pre-prepare" | "prepare" | "commit"): void => {
      setState((prev) => {
        const votes = prev.preparedBlocks.get(blockHash) || []
        const newVotes = [...votes, { nodeId, blockHash, phase }]
        const updatedBlocks = new Map(prev.preparedBlocks)
        updatedBlocks.set(blockHash, newVotes)

        return {
          ...prev,
          preparedBlocks: updatedBlocks,
        }
      })
    },
    [],
  )

  const initiateViewChange = useCallback((): void => {
    setState((prev) => ({
      ...prev,
      viewChangeInProgress: true,
      view: prev.view + 1,
    }))

    // Simulate view change completion after timeout
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        viewChangeInProgress: false,
      }))
    }, 2000)
  }, [])

  return {
    state,
    createBlock,
    canReachConsensus,
    submitBlock,
    addVote,
    initiateViewChange,
    quorumSize: QUORUM_SIZE(nodeCount),
  }
}
