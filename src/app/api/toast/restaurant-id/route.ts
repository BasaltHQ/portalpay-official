import { NextResponse } from 'next/server';

export async function GET() {
  const restaurantGuid = process.env.TOAST_RESTAURANT_ID || '';
  return NextResponse.json({ success: !!restaurantGuid, restaurantGuid });
}


