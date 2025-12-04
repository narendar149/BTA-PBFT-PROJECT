"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Clock, Users } from "lucide-react"
import { useSharedConsensus } from "@/contexts/consensus-context"

export function Dashboard() {
  const { status, round, committedBlocks, activeNodes } = useSharedConsensus()

  const stats = [
    {
      title: "Consensus Status",
      value: status,
      icon: status === "committed" ? CheckCircle : Clock,
      color: status === "committed" ? "text-green-500" : "text-yellow-500",
    },
    {
      title: "Current Round",
      value: round,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      title: "Committed Blocks",
      value: committedBlocks,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      title: "Active Nodes",
      value: activeNodes,
      icon: Users,
      color: "text-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i} className="border border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Icon className={`w-4 h-4 ${stat.color}`} />
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
