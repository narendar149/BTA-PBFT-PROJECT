"use client"

export type FaultType = "crash" | "byzantine" | "omission"

export interface FaultNode {
  nodeId: number
  faultType: FaultType
  injectedAt: number
  messagesMissed: string[]
  messagesToSend: string[]
  conflictingData?: any
}

export interface FaultEngineState {
  activeFaults: Map<number, FaultNode>
  faultLog: Array<{
    timestamp: number
    nodeId: number
    faultType: FaultType
    event: string
  }>
}

export class FaultEngine {
  private state: FaultEngineState

  constructor() {
    this.state = {
      activeFaults: new Map(),
      faultLog: [],
    }
  }

  injectFault(nodeId: number, faultType: FaultType): boolean {
    if (this.state.activeFaults.has(nodeId)) {
      return false // Fault already injected
    }

    const faultNode: FaultNode = {
      nodeId,
      faultType,
      injectedAt: Date.now(),
      messagesMissed: [],
      messagesToSend: [],
    }

    if (faultType === "byzantine") {
      // Byzantine node will send conflicting data
      faultNode.conflictingData = this.generateConflictingData()
    }

    this.state.activeFaults.set(nodeId, faultNode)
    this.logFault(nodeId, faultType, "Fault Injected")

    return true
  }

  removeFault(nodeId: number): boolean {
    if (this.state.activeFaults.has(nodeId)) {
      this.state.activeFaults.delete(nodeId)
      this.logFault(nodeId, "crash", "Fault Removed")
      return true
    }
    return false
  }

  handleCrashFault(nodeId: number, message: any): null {
    const fault = this.state.activeFaults.get(nodeId)
    if (!fault || fault.faultType !== "crash") {
      return null
    }

    // Crash node doesn't process or send any messages
    fault.messagesMissed.push(JSON.stringify(message))
    return null
  }

  handleByzantineFault(nodeId: number, message: any, nodeState: any): any {
    const fault = this.state.activeFaults.get(nodeId)
    if (!fault || fault.faultType !== "byzantine") {
      return message
    }

    // Byzantine node sometimes sends conflicting messages
    if (Math.random() > 0.5) {
      const conflicting = {
        ...message,
        data: fault.conflictingData,
        sender: nodeId,
        isByzantine: true,
      }
      return conflicting
    }

    return message
  }

  handleOmissionFault(nodeId: number, message: any, shouldSend: boolean): boolean {
    const fault = this.state.activeFaults.get(nodeId)
    if (!fault || fault.faultType !== "omission") {
      return shouldSend
    }

    // Omission fault: node receives messages but doesn't send responses
    if (shouldSend) {
      fault.messagesToSend.push(JSON.stringify(message))
      this.logFault(nodeId, "omission", `Message Omitted: ${message.type || "unknown"}`)
      return false // Don't send
    }

    return shouldSend
  }

  canNodeReceiveMessage(nodeId: number, message: any): boolean {
    const fault = this.state.activeFaults.get(nodeId)

    if (!fault) {
      return true // No fault, can receive
    }

    // Crash: cannot receive anything
    if (fault.faultType === "crash") {
      return false
    }

    // Byzantine: can receive, will process maliciously
    if (fault.faultType === "byzantine") {
      return true
    }

    // Omission: can receive
    if (fault.faultType === "omission") {
      return true
    }

    return true
  }

  canNodeSendMessage(nodeId: number): boolean {
    const fault = this.state.activeFaults.get(nodeId)

    if (!fault) {
      return true // No fault
    }

    // Crash: cannot send
    if (fault.faultType === "crash") {
      return false
    }

    // Byzantine: can send (but maliciously)
    if (fault.faultType === "byzantine") {
      return true
    }

    // Omission: cannot send
    if (fault.faultType === "omission") {
      return false
    }

    return true
  }

  getFaultStatus(nodeId: number): FaultNode | undefined {
    return this.state.activeFaults.get(nodeId)
  }

  getAllActiveFaults(): FaultNode[] {
    return Array.from(this.state.activeFaults.values())
  }

  getFaultCount(): number {
    return this.state.activeFaults.size
  }

  getFaultLog(): typeof this.state.faultLog {
    return this.state.faultLog
  }

  private logFault(nodeId: number, faultType: FaultType, event: string): void {
    this.state.faultLog.push({
      timestamp: Date.now(),
      nodeId,
      faultType,
      event,
    })
  }

  private generateConflictingData(): any {
    return {
      blockHash: `0x${Math.random().toString(16).slice(2)}`,
      proposalNumber: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    }
  }

  reset(): void {
    this.state.activeFaults.clear()
    this.state.faultLog = []
  }
}
