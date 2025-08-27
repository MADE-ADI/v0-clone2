import { NextRequest, NextResponse } from 'next/server'
import { createClient } from 'v0-sdk'

const apiKey = process.env.V0_API_KEY
const v0Client = createClient({
  apiKey: apiKey,
})

export async function GET() {
  try {
    console.log('Testing V0 API connection...')
    console.log('API Key exists:', !!apiKey)
    console.log('API Key prefix:', apiKey?.substring(0, 10))
    
    if (!apiKey) {
      return NextResponse.json({
        error: 'V0_API_KEY not configured',
        status: 'error'
      }, { status: 500 })
    }

    // Try a very simple request with short timeout
    const startTime = Date.now()
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout')), 30000) // 30 second timeout for test
    })
    
    const testCall = v0Client.chats.create({
      message: 'hello'  // Very simple message
    })
    
    const result = await Promise.race([testCall, timeoutPromise]) as any
    const duration = Date.now() - startTime
    
    console.log(`V0 API test successful after ${duration}ms`)
    
    return NextResponse.json({
      status: 'success',
      message: 'V0 API connection working',
      duration: `${duration}ms`,
      chatId: result?.id || 'unknown',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('V0 API test failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
