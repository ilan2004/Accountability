import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userName, taskTitle, points, partnerId } = body;

    // Get partner's WhatsApp number from Firebase
    const partnerDoc = await getDoc(doc(db, 'users', partnerId));
    const partnerData = partnerDoc.data();

    if (!partnerData?.whatsappNumber) {
      return NextResponse.json({ 
        success: false, 
        error: 'Partner WhatsApp number not found' 
      });
    }

    // Prepare message based on type
    let message = '';
    switch (type) {
      case 'task_completed':
        message = `🎉 *Accountability Update!*\n\n${userName} just completed: *"${taskTitle}"* 💪\n\nPoints earned: +${points} ⭐\n\nKeep up the great work! 🚀`;
        break;
      case 'daily_summary':
        message = `📋 *Daily Tasks Summary*\n\n${userName} has added today's tasks!\n\nStay tuned for updates throughout the day 📈`;
        break;
      default:
        message = `📱 Accountability update from ${userName}!`;
    }

    // Send to WhatsApp backend service
    const whatsappResponse = await fetch(`${process.env.WHATSAPP_API_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: partnerData.whatsappNumber,
        message: message,
      }),
    });

    if (!whatsappResponse.ok) {
      throw new Error('Failed to send WhatsApp message');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WhatsApp notification error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send notification' 
    }, { status: 500 });
  }
}
