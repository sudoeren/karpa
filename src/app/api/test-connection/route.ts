import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      // Try the models endpoint first
      const response = await fetch(`${url}/v1/models`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ 
          success: true, 
          models: data?.data?.length || 0,
          message: 'Connected successfully'
        })
      }
      
      // If models endpoint returns error, try health check
      const healthResponse = await fetch(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
        }),
      })
      
      // Server is running even if it returns 400/422 (no model loaded)
      if (healthResponse.ok || healthResponse.status === 400 || healthResponse.status === 422) {
        return NextResponse.json({ 
          success: true, 
          models: 0,
          message: 'Server is running but no model info available'
        })
      }

      return NextResponse.json({ 
        success: false, 
        error: `Server returned ${response.status}` 
      }, { status: 502 })

    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({ 
          success: false, 
          error: 'Connection timed out' 
        }, { status: 504 })
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot reach server. Is LM Studio running?' 
      }, { status: 502 })
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Invalid request' 
    }, { status: 400 })
  }
}
