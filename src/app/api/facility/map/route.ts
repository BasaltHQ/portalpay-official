import { NextRequest, NextResponse } from 'next/server';
import { createServerBearCloudAPI } from '@/lib/services/bear-cloud-server';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Route: Getting facility map');
    
    const bearAPI = createServerBearCloudAPI();
    const facilityMap = await bearAPI.getFacilityMap();
    
    return NextResponse.json({
      success: true,
      data: facilityMap
    });
  } catch (error) {
    console.error('❌ API Route error getting facility map:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch facility map',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}