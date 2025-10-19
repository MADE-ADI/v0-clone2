import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'

// Configure the maximum duration for this API route (10 minutes = 600 seconds)
// This tells Vercel/Next.js to allow longer execution time
export const maxDuration = 600 // 10 minutes in seconds
export const dynamic = 'force-dynamic' // Ensure this route is always dynamic

// Validate API key before creating client
const apiKey = process.env.V0_API_KEY
if (!apiKey) {
  console.error('V0_API_KEY is not set in environment variables')
}

// Create client with explicit API key and error handling
const v0Client = createClient({
  apiKey: apiKey,
})

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  // Set timeout for the request (increased to 10 minutes)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 600000) // 10 minute timeout
  let startTime: number = 0
  let progressInterval: NodeJS.Timeout | undefined
  
  try {
    // Debug: Check environment and API key
    console.log('V0_API_KEY exists:', !!process.env.V0_API_KEY)
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'V0 API key not configured' },
        { status: 500 }
      )
    }
    
    const { message, chatId } = await request.json()
    console.log('Creating chat for message:', message?.substring(0, 50) + (message?.length > 50 ? '...' : ''))

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      )
    }

    let chat
    let retryCount = 0
    const maxRetries = 2

    startTime = Date.now()
    console.log(`[${new Date().toISOString()}] Attempting to call V0 API...`)
    console.log(`[${new Date().toISOString()}] Max timeout configured: 10 minutes (600 seconds)`)
    
    // Log progress every 30 seconds to show the request is still alive
    progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      console.log(`[${new Date().toISOString()}] Request still processing... Elapsed: ${(elapsed/1000).toFixed(1)}s`)
    }, 30000) // Log every 30 seconds
    
    while (retryCount <= maxRetries) {
      try {
        // Create timeout promise (increased to 10 minutes for complex V0 processing)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            clearInterval(progressInterval)
            reject(new Error('V0 API request timeout after 10 minutes'))
          }, 600000) // 10 minute timeout
        })
        
        let apiCall: Promise<any>
        
        if (chatId) {
          // continue existing chat
          console.log(`[${new Date().toISOString()}] Continuing existing chat (attempt ${retryCount + 1}):`, chatId)
          apiCall = v0Client.chats.sendMessage({
            chatId: chatId,
            message,
          })
        } else {
          // create new chat
          console.log(`[${new Date().toISOString()}] Creating new chat (attempt ${retryCount + 1}) with message:`, message.substring(0, 100))
          apiCall = v0Client.chats.create({
            message,
          })
        }
        
        // Race between API call and timeout
        chat = await Promise.race([apiCall, timeoutPromise])
        
        // If we get here, the call succeeded
        clearInterval(progressInterval) // Clear progress logging
        break
        
      } catch (error) {
        retryCount++
        const currentDuration = Date.now() - startTime
        
        if (retryCount > maxRetries) {
          // Max retries reached, throw the error
          clearInterval(progressInterval) // Clear progress logging
          throw error
        }
        
        console.warn(`[${new Date().toISOString()}] V0 API attempt ${retryCount} failed after ${currentDuration}ms, retrying...`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          attempt: retryCount,
          maxRetries
        })
        
        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // Clear timeout and progress logging if API call succeeds
    clearTimeout(timeoutId)
    clearInterval(progressInterval)

    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`[${new Date().toISOString()}] V0 API response received after ${duration}ms (${(duration/1000).toFixed(2)}s):`, {
      chatId: chat.id,
      hasDemo: !!chat.demo,
      messageCount: chat.messages?.length || 0,
      processingTime: `${duration}ms`
    })

    return NextResponse.json({
      id: chat.id,
      demo: chat.demo,
      messages: chat.messages?.map((msg: any) => ({
        ...msg,
        experimental_content: (msg as any).experimental_content,
      })),
    })
  } catch (error) {
    // Clear timeout and progress interval in case of error
    clearTimeout(timeoutId)
    if (progressInterval) clearInterval(progressInterval)
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.error(`[${new Date().toISOString()}] V0 API Error after ${duration}ms (${(duration/1000).toFixed(2)}s):`, {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      processingTime: `${duration}ms`
    })
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('timeout') ? 504 :
                      errorMessage.includes('401') ? 401 : 
                      errorMessage.includes('403') ? 403 :
                      errorMessage.includes('API key') ? 401 : 500
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode },
    )
  }
}
