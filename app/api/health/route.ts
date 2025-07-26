import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'P2P DEX Platform'
  });
}

export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 