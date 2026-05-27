import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files'); // Retrieve all files appended to 'files'

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files provided' }, { status: 400 });
    }

    const mediaServerUrl = process.env.MEDIA_SERVER_URL || 'https://media-server.ashostgg.com';
    const mediaApiKey = process.env.MEDIA_API_KEY || 'pubg-media-super-secret-key-2026';

    // Create a new FormData to send to the media server
    const serverFormData = new FormData();
    files.forEach(file => {
      serverFormData.append('files', file); // Append each file to 'files' array
    });

    const response = await fetch(`${mediaServerUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': mediaApiKey,
      },
      body: serverFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, message: data.message || 'Media server error' }, { status: response.status });
    }

    return NextResponse.json(data); // `data` now contains `files` array
  } catch (error) {
    console.error('Proxy upload error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
