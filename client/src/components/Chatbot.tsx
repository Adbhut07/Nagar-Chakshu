"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, Bot, User, Send, Loader2, Sparkles } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { sendChatMessage, generateSessionId } from "@/lib/chatbotService"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => generateSessionId())
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading || !user) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input.trim()
    setInput("")
    setIsLoading(true)

    try {
      const response = await sendChatMessage(currentInput, user.uid, sessionId)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data.final_response || "I'm sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chatbot API error:', error)
      
      let errorContent = "I'm experiencing some technical difficulties. Please try again later.";
      
      if (error instanceof Error) {
        if (error.message.includes('Chatbot API URL not configured')) {
          errorContent = "Chatbot service is not properly configured. Please contact support.";
        } else if (error.message.includes('400')) {
          errorContent = "Invalid request format. Please try rephrasing your message.";
        } else if (error.message.includes('404')) {
          errorContent = "Chatbot service is currently unavailable. Please try again later.";
        } else if (error.message.includes('500')) {
          errorContent = "Server error occurred. Please try again in a few moments.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorContent = "Network connection issue. Please check your internet connection and try again.";
        }
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date(),
      }
      
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    if (!isLoading) {
      setInput(suggestion)
    }
  }

  return (
    <Card className="h-[85vh] max-w-2xl mx-auto bg-black/95 backdrop-blur-xl border border-white shadow-2xl flex flex-col overflow-hidden">
      <CardHeader className="pb-4 border-b border-white/10 bg-black/80 backdrop-blur-sm">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/20">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Nagar <span className="text-orange-500">Chakshu</span>
                </span>
                <span className="text-sm font-medium text-gray-300">Assistant</span>
              </div>
              <span className="text-xs text-gray-400 font-normal">AI-powered city services</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
            <span className="text-xs text-gray-400 font-medium">Online</span>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 bg-gradient-to-b from-black/90 to-black/95">
        {/* Chat Messages Area */}
        <div
          className="flex-1 px-6 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
          ref={scrollAreaRef}
        >
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-white/20">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Welcome to <span >Nagar </span>Chakshu</h3>
                <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                  Your intelligent assistant for city services, traffic updates, and local information. How can I help
                  you today?
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-500 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm border border-white/30"
                      : "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                <div className={`flex-1 max-w-[75%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                  <div
                    className={`inline-block px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-white/20 to-white/15 text-white border border-white/30 rounded-br-md"
                        : "bg-gradient-to-r from-white/10 to-white/5 text-gray-200 border border-white/20 rounded-bl-md"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-xs font-medium">{message.content}</div>
                    <div
                      className={`text-xs mt-2 font-normal ${
                        message.role === "user" ? "text-gray-300" : "text-gray-400"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-500">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-gray-300" />
                </div>
                <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl rounded-bl-md shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="border-t border-white/10 p-6 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={user ? "Ask about city services, traffic, events..." : "Please sign in to use the chatbot"}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 text-sm h-11 rounded-xl shadow-lg pr-16"
                disabled={isLoading || !user}
                maxLength={500}
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400 font-medium">{input.length}/500</span>
              </div>
            </div>
            <Button
              type="submit"
              size="icon"
              className="bg-gradient-to-r from-white/20 to-white/15 backdrop-blur-sm hover:from-white/30 hover:to-white/25 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:ring-2 focus:ring-white/20 h-11 w-11 rounded-xl border border-white/30"
              disabled={isLoading || !input.trim() || !user}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 justify-center">
              {["What's the traffic situation?", "Recent events in my area", "How to report an issue?"].map(
                (suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs px-3 py-2 bg-white/10 backdrop-blur-sm text-gray-300 rounded-lg border border-white/20 hover:bg-white/20 hover:text-white hover:border-white/30 transition-all duration-200 hover:scale-105 font-medium shadow-lg"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
