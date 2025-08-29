'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { AuthWidget } from '@/components/auth/AuthWidget'
import { ThemeToggle } from '@/components/theme-toggle'
import { DownloadButton, FilePreviewButton } from '@/components/DownloadButton'
import { TestDownloadButton } from '@/components/TestDownloadButton'
import MobilePreviewButton from '@/components/MobilePreviewButton'
import { Button } from '@/components/ui/button'

import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'
import { Message, MessageContent } from '@/components/ai-elements/message'
import {
  Conversation,
  ConversationContent,
} from '@/components/ai-elements/conversation'
import {
  WebPreview,
  WebPreviewNavigation,
  WebPreviewUrl,
  WebPreviewBody,
} from '@/components/ai-elements/web-preview'
import { Loader } from '@/components/ai-elements/loader'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { MessageRenderer } from '@/components/message-renderer'

interface Chat {
  id: string
  demo: string
  messages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    experimental_content?: any // The structured content from v0 API
  }>
}

export default function Home() {
  const { data: session } = useSession()
  const [message, setMessage] = useState('')
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [chatHistory, setChatHistory] = useState<
    Array<{
      type: 'user' | 'assistant'
      content: string | any // Can be string or MessageBinaryFormat
    }>
  >([])

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!message.trim() || isLoading) return

    // If not authenticated, show login modal and block submission
    if (!session?.user) {
      setShowLoginModal(true)
      return
    }

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    setChatHistory((prev) => [...prev, { type: 'user', content: userMessage }])

    try {
      console.log('Sending request to /api/chat...')
      
      // Create an AbortController for the request timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minute timeout to match API
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          chatId: currentChat?.id,
        }),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error Response:', errorData)
        throw new Error(`API Error: ${response.status} - ${errorData}`)
      }

      let chat: Chat
      try {
        chat = await response.json()
        console.log('Successfully parsed chat response:', {
          id: chat.id,
          demo: chat.demo,
          messagesLength: chat.messages?.length,
          hasDemo: !!chat.demo
        })
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        // Note: Can't read response.text() again after response.json() failed
        throw new Error('Invalid JSON response from API')
      }

      // Validate required fields
      if (!chat.id) {
        console.error('Missing chat.id in response:', chat)
        throw new Error('Invalid response: missing chat ID')
      }

      console.log('Setting current chat...')
      setCurrentChat(chat)

      // Update chat history with structured content from v0 API
      try {
        if (chat.messages && Array.isArray(chat.messages)) {
          console.log('Processing chat messages:', chat.messages.length)
          setChatHistory(
            chat.messages.map((msg, index) => {
              console.log(`Processing message ${index}:`, {
                role: msg.role,
                hasContent: !!msg.content,
                hasExperimentalContent: !!msg.experimental_content
              })
              return {
                type: msg.role,
                content: msg.experimental_content || msg.content,
              }
            }),
          )
        } else {
          console.log('No valid messages array, using fallback. Messages:', chat.messages)
          // Final fallback
          setChatHistory((prev) => [
            ...prev,
            {
              type: 'assistant',
              content: 'Generated new app preview. Check the preview panel!',
            },
          ])
        }
        console.log('Chat history updated successfully')
      } catch (historyError) {
        console.error('Error updating chat history:', historyError)
        throw historyError
      }
    } catch (error) {
      console.error('Frontend Error Details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        type: typeof error
      })
      
      // Handle different types of errors with specific messages
      let errorMessage = "Sorry, there was an error creating your app. Please try again."
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = "Request timed out. The generation process is taking longer than expected. Please try with a simpler request."
        } else if (error.message.includes('504')) {
          errorMessage = "Server timeout (504). The generation process took too long. Please try with a simpler request or try again later."
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network connection error. Please check your internet connection and try again."
        } else {
          errorMessage = `Error: ${error.message}. Please try again.`
        }
      }
      
      setChatHistory((prev) => [
        ...prev,
        {
          type: 'assistant',
          content: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="h-screen flex flex-col md:flex-row mobile-safe-area">
        {/* Chat Panel */}
        <div className="flex-1 md:w-1/2 flex flex-col md:border-r mobile-chat-height md:h-auto">
          {/* Header */}
          <div className="border-b p-3 h-14 flex items-center justify-between flex-shrink-0">
            <h1 className="text-lg font-semibold">v0 Clone</h1>
            <div className="flex items-center gap-2">
              {/* Debug: Show current chat status */}
              {/* <span className="text-xs text-muted-foreground">
                Chat: {currentChat ? 'Yes' : 'No'}
              </span> */}
              {/* Test download button */}
              {/* <TestDownloadButton /> */}
              {/* {currentChat && (
                <>
                  <FilePreviewButton chat={currentChat} />
                  <DownloadButton 
                    chat={currentChat} 
                    projectName={`v0-project-${currentChat.id.slice(-6)}`}
                  />
                </>
              )} */}
              <ThemeToggle />
              <AuthWidget />
            </div>
          </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-semibold">What can we build together?</p>
                <p className="mt-2 text-sm md:text-base text-muted-foreground">Build real, working software just by describing it</p>
              </div>
            </div>
          ) : (
            <>
              <Conversation>
                <ConversationContent>
                  {chatHistory.map((msg, index) => (
                    <Message from={msg.type} key={index}>
                      <MessageRenderer
                        content={msg.content}
                        role={msg.type}
                        messageId={`msg-${index}`}
                      />
                    </Message>
                  ))}
                </ConversationContent>
              </Conversation>
              {isLoading && (
                <Message from="assistant">
                  <MessageContent>
                    <div className="flex items-center gap-2">
                      <Loader />
                      <div className="space-y-1">
                        <div>Creating your app...</div>
                        <div className="text-xs text-muted-foreground">
                          This may take up to 60 seconds as we generate your code
                        </div>
                      </div>
                    </div>
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 flex-shrink-0 mobile-input-area">
          {!currentChat && (
            <Suggestions>
              <Suggestion
                onClick={() =>
                  setMessage('Create a responsive navbar with Tailwind CSS')
                }
                suggestion="Create a responsive navbar with Tailwind CSS"
              />
              <Suggestion
                onClick={() => setMessage('Build a todo app with React')}
                suggestion="Build a todo app with React"
              />
              <Suggestion
                onClick={() =>
                  setMessage('Make a landing page for a coffee shop')
                }
                suggestion="Make a landing page for a coffee shop"
              />
            </Suggestions>
          )}
          <div className="flex gap-2">
            <PromptInput
              onSubmit={handleSendMessage}
              className="mt-4 w-full max-w-2xl mx-auto relative"
            >
              <PromptInputTextarea
                onChange={(e) => setMessage(e.target.value)}
                value={message}
                className="pr-12 min-h-[60px]"
              />
              <PromptInputSubmit
                className="absolute bottom-1 right-1"
                disabled={!message}
                status={isLoading ? 'streaming' : 'ready'}
              />
            </PromptInput>
          </div>
        </div>
      </div>

      {/* Preview Panel - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex md:w-1/2 flex-col">
        <WebPreview>
          <WebPreviewNavigation>
            <WebPreviewUrl
              readOnly
              placeholder={currentChat && currentChat.demo ? "Your app here..." : "Preview will appear after generation completes"}
              value={currentChat?.demo}
            />
            {currentChat && currentChat.demo && (
              <div className="flex items-center gap-2 ml-2">
                <DownloadButton 
                  chat={currentChat} 
                  projectName={`v0-project-${currentChat.id.slice(-6)}`}
                  className="text-xs"
                />
              </div>
            )}
          </WebPreviewNavigation>
          {currentChat && currentChat.demo ? (
            <WebPreviewBody src={currentChat.demo} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <div className="text-lg">No preview available</div>
                <div className="text-sm">Generate an app to see the preview</div>
              </div>
            </div>
          )}
        </WebPreview>
      </div>

      {/* Mobile Preview Button - Only shows when there's a generated app */}
      <MobilePreviewButton chat={currentChat} />
    </div>

      {/* Login Required Modal */}
      <div className={`${showLoginModal ? 'fixed' : 'hidden'} inset-0 z-50 flex items-center justify-center`}
        aria-modal="true" role="dialog">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginModal(false)} />
        <div className="relative w-[92%] max-w-sm rounded-lg border bg-background p-6 shadow-xl">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please sign in to submit a prompt and generate your app preview.
          </p>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowLoginModal(false)}>Cancel</Button>
            <Button onClick={() => signIn('google')}>Continue with Google</Button>
          </div>
        </div>
      </div>
    </>
  )
}
