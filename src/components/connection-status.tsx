"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle2, RefreshCw, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export function ConnectionStatus() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkConnection = async () => {
    setStatus("checking")
    try {
      // Default URL or from settings
      let url = localStorage.getItem("lm-studio-url") || "http://localhost:1234"
      if (url.endsWith('/')) url = url.slice(0, -1)
      
      // Try to fetch models endpoint which is standard in OpenAI/LM Studio API
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        // Short timeout
        signal: AbortSignal.timeout(3000)
      })

      if (response.ok) {
        setStatus("connected")
      } else {
        setStatus("disconnected")
      }
    } catch (error) {
      setStatus("disconnected")
    } finally {
      setLastChecked(new Date())
    }
  }

  useEffect(() => {
    checkConnection()
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-8 gap-2 rounded-full px-3 text-[10px] font-bold uppercase tracking-widest border transition-all",
            status === "connected" 
              ? "border-green-500/20 bg-green-500/10 text-green-600 hover:bg-green-500/20" 
              : status === "disconnected"
                ? "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20"
                : "border-muted-foreground/20 bg-muted/10 text-muted-foreground"
          )}
        >
          {status === "checking" ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : status === "connected" ? (
            <CheckCircle2 className="size-3.5" />
          ) : (
            <AlertCircle className="size-3.5" />
          )}
          <span className="hidden sm:inline">
            {status === "connected" ? "LM Studio Online" : status === "disconnected" ? "LM Studio Offline" : "Checking..."}
          </span>
          <span className="sm:hidden">
            {status === "connected" ? "Online" : status === "disconnected" ? "Offline" : "..."}
          </span>
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4 rounded-2xl shadow-xl" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "size-10 rounded-xl flex items-center justify-center shrink-0",
              status === "connected" ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"
            )}>
              <Power className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold">LM Studio Status</h4>
              <p className="text-xs text-muted-foreground">
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {status === "connected" ? (
              <div className="p-3 bg-green-500/5 rounded-xl border border-green-500/10 text-xs text-green-700 dark:text-green-400">
                <p className="font-semibold mb-1">System Operational</p>
                All systems go. Localce is connected to your local LLM server.
              </div>
            ) : (
              <div className="p-3 bg-destructive/5 rounded-xl border border-destructive/10 text-xs text-destructive dark:text-red-400">
                <p className="font-semibold mb-1">Connection Failed</p>
                <ul className="list-disc pl-4 space-y-1 opacity-90">
                  <li>Ensure LM Studio is running</li>
                  <li>Check if Local Server is started (Start Server button)</li>
                  <li>Verify port is 1234 (default)</li>
                  <li>Check CORS settings in LM Studio</li>
                </ul>
              </div>
            )}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="w-full rounded-xl text-xs font-bold"
            onClick={checkConnection}
            disabled={status === "checking"}
          >
            {status === "checking" ? (
              <>
                <RefreshCw className="size-3.5 mr-2 animate-spin" />
                Checking Connection...
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5 mr-2" />
                Check Again
              </>
            )}
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
