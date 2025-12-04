"use client"

import { useEffect, useRef } from "react"
import { useSharedConsensus } from "@/contexts/consensus-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NetworkVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { nodes, messages } = useSharedConsensus()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = 450

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, "#0f172a")
    gradient.addColorStop(1, "#1e293b")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid background
    ctx.strokeStyle = "rgba(100, 116, 139, 0.1)"
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw message flows
    messages.forEach((message) => {
      const fromNode = nodes.find((n) => n.id === message.from)
      const toNode = nodes.find((n) => n.id === message.to)

      if (fromNode && toNode) {
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
        const distance = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y)
        const startX = fromNode.x + 35 * Math.cos(angle)
        const startY = fromNode.y + 35 * Math.sin(angle)
        const endX = toNode.x - 35 * Math.cos(angle)
        const endY = toNode.y - 35 * Math.sin(angle)

        // Draw line
        let lineColor = "#3b82f6"
        if (message.type === "vote") lineColor = "#10b981"
        else if (message.type === "acknowledgment") lineColor = "#f59e0b"

        ctx.strokeStyle = lineColor
        ctx.lineWidth = 2.5
        ctx.setLineDash(message.status === "pending" ? [5, 5] : [])
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw arrow
        const arrowSize = 12
        ctx.fillStyle = lineColor
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6))
        ctx.fill()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      let nodeColor = "#6366f1"
      let glowColor = "rgba(99, 102, 241, 0.5)"

      if (node.faulty) {
        nodeColor = "#ef4444"
        glowColor = "rgba(239, 68, 68, 0.5)"
      } else if (node.role === "leader") {
        nodeColor = "#f59e0b"
        glowColor = "rgba(245, 158, 11, 0.5)"
      } else if (node.status === "committed") {
        nodeColor = "#10b981"
        glowColor = "rgba(16, 185, 129, 0.5)"
      }

      // Draw glow effect
      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 40)
      gradient.addColorStop(0, glowColor)
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = gradient
      ctx.fillRect(node.x - 40, node.y - 40, 80, 80)

      // Node circle
      ctx.fillStyle = nodeColor
      ctx.beginPath()
      ctx.arc(node.x, node.y, 30, 0, Math.PI * 2)
      ctx.fill()

      // Node border
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(node.x, node.y, 30, 0, Math.PI * 2)
      ctx.stroke()

      // Status indicator
      if (node.faulty) {
        ctx.fillStyle = "#ff4444"
        ctx.fillRect(node.x + 20, node.y - 20, 12, 12)
      } else if (node.status === "committed") {
        ctx.fillStyle = "#44ff44"
        ctx.beginPath()
        ctx.arc(node.x + 22, node.y - 20, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      // Node label
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`N${node.id}`, node.x, node.y)
    })
  }, [nodes, messages])

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle>Network Topology</CardTitle>
        <CardDescription>Real-time visualization of node states and message propagation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-lg border border-border overflow-hidden shadow-xl">
          <canvas ref={canvasRef} className="w-full" />
        </div>
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-border">
            <div className="w-4 h-4 rounded-full bg-indigo-500" />
            <span className="text-xs">Normal</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-border">
            <div className="w-4 h-4 rounded-full bg-amber-500" />
            <span className="text-xs">Leader</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-border">
            <div className="w-4 h-4 rounded-full bg-green-500" />
            <span className="text-xs">Committed</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-border">
            <div className="w-4 h-4 rounded-full bg-red-500" />
            <span className="text-xs">Faulty</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-lg border border-border">
            <div className="w-1 h-4 bg-blue-400" />
            <span className="text-xs">Messages</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
