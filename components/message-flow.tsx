"use client"

import { useSharedConsensus } from "@/contexts/consensus-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function MessageFlow() {
  const { messageLog } = useSharedConsensus()

  // Categorize messages by type
  const categorizeMessages = () => {
    const preprepareMsgs = messageLog.filter((m) => m.type === "PRE-PREPARE")
    const prepareMsgs = messageLog.filter((m) => m.type === "PREPARE")
    const commitMsgs = messageLog.filter((m) => m.type === "COMMIT")
    const systemMsgs = messageLog.filter((m) => m.type === "Initialize" || m.type === "Block Committed")
    const faultMsgs = messageLog.filter(
      (m) => m.type.includes("Fault") || m.status === "faulty" || m.status === "CRITICAL",
    )

    return { preprepareMsgs, prepareMsgs, commitMsgs, systemMsgs, faultMsgs }
  }

  const { preprepareMsgs, prepareMsgs, commitMsgs, systemMsgs, faultMsgs } = categorizeMessages()

  const getMessageBadgeColor = (type: string) => {
    switch (type) {
      case "PRE-PREPARE":
        return "bg-blue-500 hover:bg-blue-600"
      case "PREPARE":
        return "bg-green-500 hover:bg-green-600"
      case "COMMIT":
        return "bg-purple-500 hover:bg-purple-600"
      case "Initialize":
        return "bg-cyan-500 hover:bg-cyan-600"
      case "Block Committed":
        return "bg-emerald-500 hover:bg-emerald-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const MessageLogItem = ({ log }: { log: any }) => (
    <div className="flex items-start gap-3 py-2 px-3 hover:bg-slate-900 rounded-md transition-colors border-l-2 border-transparent hover:border-indigo-600">
      <span className="text-gray-500 text-xs font-mono flex-shrink-0 w-20">{log.timestamp}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-blue-400 font-mono text-xs">{log.from}</span>
          <span className="text-gray-600">→</span>
          <span className="text-green-400 font-mono text-xs">{log.to}</span>
          <Badge variant="default" className={`${getMessageBadgeColor(log.type)} text-xs py-0 px-2`}>
            {log.type}
          </Badge>
          {log.status && (
            <Badge
              variant="secondary"
              className={
                log.status === "CRITICAL" ? "bg-red-600" : log.status === "faulty" ? "bg-orange-600" : "bg-yellow-600"
              }
            >
              {log.status}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  const MessageLogSection = ({ title, messages, icon }: { title: string; messages: any[]; icon?: string }) => (
    <div>
      <h4 className="text-sm font-bold text-muted-foreground mb-2">
        {icon} {title} ({messages.length})
      </h4>
      {messages.length === 0 ? (
        <p className="text-xs text-gray-600 italic">No messages</p>
      ) : (
        <div className="space-y-0">
          {messages.map((log, i) => (
            <MessageLogItem key={i} log={log} />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle>Consensus Message Flow</CardTitle>
        <CardDescription>Real-time sequence of messages exchanged during consensus</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            <TabsTrigger value="categorized">By Type</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <ScrollArea className="h-96 border border-border rounded-lg p-4 bg-slate-950">
              <div className="space-y-3 pr-4">
                {messageLog.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No messages yet. Start consensus to see message flow.</p>
                ) : (
                  messageLog.map((log, i) => <MessageLogItem key={i} log={log} />)
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="categorized" className="space-y-4">
            <ScrollArea className="h-96 border border-border rounded-lg p-4 bg-slate-950">
              <div className="space-y-6 pr-4">
                <MessageLogSection title="System Messages" messages={systemMsgs} icon="◆" />
                <div className="border-t border-border pt-4" />
                <MessageLogSection title="Pre-Prepare Phase" messages={preprepareMsgs} icon="●" />
                <div className="border-t border-border pt-4" />
                <MessageLogSection title="Prepare Phase" messages={prepareMsgs} icon="●" />
                <div className="border-t border-border pt-4" />
                <MessageLogSection title="Commit Phase" messages={commitMsgs} icon="●" />
                {faultMsgs.length > 0 && (
                  <>
                    <div className="border-t border-border pt-4" />
                    <MessageLogSection title="Fault Events" messages={faultMsgs} icon="⚠" />
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Message statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-slate-950 rounded-lg p-3 text-center border border-border">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-xl font-bold">{messageLog.length}</p>
          </div>
          <div className="bg-blue-950 rounded-lg p-3 text-center border border-blue-900/50">
            <p className="text-xs text-blue-300">PRE-PREPARE</p>
            <p className="text-xl font-bold text-blue-400">{preprepareMsgs.length}</p>
          </div>
          <div className="bg-green-950 rounded-lg p-3 text-center border border-green-900/50">
            <p className="text-xs text-green-300">PREPARE</p>
            <p className="text-xl font-bold text-green-400">{prepareMsgs.length}</p>
          </div>
          <div className="bg-purple-950 rounded-lg p-3 text-center border border-purple-900/50">
            <p className="text-xs text-purple-300">COMMIT</p>
            <p className="text-xl font-bold text-purple-400">{commitMsgs.length}</p>
          </div>
          <div className="bg-red-950 rounded-lg p-3 text-center border border-red-900/50">
            <p className="text-xs text-red-300">Faults</p>
            <p className="text-xl font-bold text-red-400">{faultMsgs.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
