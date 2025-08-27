import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'

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
  try {
    // Debug: Check environment and API key
    console.log('Environment:', process.env.NODE_ENV)
    console.log('Request URL:', request.url)
    console.log('Request headers:', Object.fromEntries(request.headers.entries()))
    console.log('V0_API_KEY exists:', !!process.env.V0_API_KEY)
    console.log('V0_API_KEY starts with:', process.env.V0_API_KEY?.substring(0, 10))
    
    const { message, chatId } = await request.json()
    console.log('Request payload:', { message: message?.substring(0, 50), chatId })

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 },
      )
    }

    let chat

    console.log('Attempting to call V0 API...')
    
    if (chatId) {
      // continue existing chat
      console.log('Continuing existing chat:', chatId)
      chat = await v0Client.chats.sendMessage({
        chatId: chatId,
        message,
      })
    } else {
      // create new chat
      console.log('Creating new chat with message:', message.substring(0, 100))
      chat = await v0Client.chats.create({
        message,
      })
    }

    console.log('V0 API response received:', {
      chatId: chat.id,
      hasDemo: !!chat.demo,
      messageCount: chat.messages?.length || 0
    })

    return NextResponse.json({
      id: chat.id,
      demo: chat.demo,
      messages: chat.messages?.map((msg) => ({
        ...msg,
        experimental_content: (msg as any).experimental_content,
      })),
    })
  } catch (error) {
    console.error('V0 API Error Details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const statusCode = errorMessage.includes('401') ? 401 : 
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
