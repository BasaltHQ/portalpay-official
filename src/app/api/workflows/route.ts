import { NextRequest, NextResponse } from 'next/server';
import { createServerBearCloudAPI } from '@/lib/services/bear-cloud-server';

export async function GET(request: NextRequest) {
  try {
    console.log('📡 API Route: Getting all workflows');
    
    const bearAPI = createServerBearCloudAPI();
    const workflows = await bearAPI.getWorkflows();
    
    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    console.error('❌ API Route error getting workflows:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch workflows',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📡 API Route: Creating new workflow');
    
    const body = await request.json();
    const { name, keyframes, status = 'draft' } = body;
    
    if (!name || !keyframes) {
      return NextResponse.json({
        success: false,
        error: 'Name and keyframes are required'
      }, { status: 400 });
    }
    
    const bearAPI = createServerBearCloudAPI();
    const workflow = await bearAPI.createWorkflow({
      name,
      keyframes,
      status
    });
    
    if (!workflow) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create workflow'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: workflow,
      message: `Workflow '${name}' created successfully`
    });
  } catch (error) {
    console.error('❌ API Route error creating workflow:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create workflow',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}