'use client'

import ChatInterface from '../ChatInterface'

export default function Chat() {
  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">AI Assistant</h1>
        <p className="text-gray-400 text-sm mt-1">
          Talk naturally — ask about your balance, send XLM, swap tokens, manage contacts and more.
        </p>
      </div>
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  )
}
