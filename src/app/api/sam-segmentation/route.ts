import { NextRequest, NextResponse } from 'next/server';

// Azure SAM configuration
const AZURE_SAM_CONFIG = {
  endpoint: 'https://varuni.eastus2.inference.ml.azure.com/score',
  apiKey: 'FtUsk1gSK6c7M3fLAor9mjEdWsd4bVUIRIs8G7zEgENA0HDluoC6JQQJ99BGAAAAAAAAAAAAINFRAZMLhPnN'
};

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 SAM API Route: Processing segmentation request');
    
    const body = await request.json();
    const { image, inputPoints, inputLabels, multimaskOutput = true } = body;
    
    if (!image || !inputPoints || !inputLabels) {
      return NextResponse.json(
        { error: 'Missing required fields: image, inputPoints, inputLabels' },
        { status: 400 }
      );
    }
    
    console.log('📍 Processing points:', inputPoints);
    console.log('🏷️ Processing labels:', inputLabels);
    
    // Format the request according to Azure SAM documentation
    const requestPayload = {
      input_data: {
        columns: [
          "image",
          "input_points", 
          "input_boxes",
          "input_labels",
          "multimask_output"
        ],
        index: [0],
        data: [[
          image,                           // base64 image
          JSON.stringify(inputPoints),     // input_points as JSON string
          "",                              // input_boxes (empty for point-based)
          JSON.stringify(inputLabels),     // input_labels as JSON string  
          multimaskOutput                  // multimask_output boolean
        ]]
      },
      params: {}
    };
    
    console.log('📤 Sending request to Azure SAM endpoint');
    console.log('📋 Request structure:', {
      columns: requestPayload.input_data.columns,
      dataLength: requestPayload.input_data.data[0].length,
      pointCount: JSON.parse(requestPayload.input_data.data[0][1] as string).length
    });
    
    // Make request to Azure SAM endpoint
    const samResponse = await fetch(AZURE_SAM_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AZURE_SAM_CONFIG.apiKey}`,
        'azureml-model-deployment': 'sam'
      },
      body: JSON.stringify(requestPayload),
    });
    
    console.log('📨 Azure SAM Response status:', samResponse.status);
    
    if (!samResponse.ok) {
      const errorText = await samResponse.text();
      console.error('❌ Azure SAM error:', errorText);
      return NextResponse.json(
        { error: `Azure SAM API error: ${samResponse.status} - ${errorText}` },
        { status: samResponse.status }
      );
    }
    
    const result = await samResponse.json();
    console.log('✅ Azure SAM success:', { 
      resultType: typeof result,
      isArray: Array.isArray(result),
      length: Array.isArray(result) ? result.length : 'N/A'
    });
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('💥 SAM API Route error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 