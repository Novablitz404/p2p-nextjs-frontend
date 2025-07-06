import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    console.log('Removing push subscription:', subscription);

    // Here you would typically remove the subscription from your database
    // For now, we'll just log it and return success
    
    // Example: Remove from database
    // await db.collection('pushSubscriptions')
    //   .where('subscription.endpoint', '==', subscription.endpoint)
    //   .delete();

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });

  } catch (error) {
    console.error('Error removing subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove subscription' 
      },
      { status: 500 }
    );
  }
} 