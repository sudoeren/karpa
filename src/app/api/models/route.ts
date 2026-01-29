import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Ensure URL doesn't end with slash
    const baseUrl = url.replace(/\/$/, '')
    
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`)
    }

    const data = await response.json()
    return NextResponse.json({ 
      success: true, 
      models: data.data || [] 
    })

  } catch (error) {
    console.error('Model fetch error:', error)
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message || 'Failed to fetch models' 
    }, { status: 500 })
  }
}
