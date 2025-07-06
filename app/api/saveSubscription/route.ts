import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();
    
    console.log('Saving push subscription:', subscription);

    // Here you would typically save the subscription to your database
    // For now, we'll just log it and return success
    
    // Example: Save to database
    // await db.collection('pushSubscriptions').add({
    //   subscription: subscription,
    //   userId: userId,
    //   createdAt: new Date()
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription saved successfully' 
    });

  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to save subscription' 
      },
      { status: 500 }
    );
  }
} 