import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';

const DEMO_USERS = {
  admin: 'admin123',
  user: 'user123',
};

export async function POST(request: NextRequest) {
  try {
    const { username, password, adminCode } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }

    // Simple validation - in production use a database
    if (adminCode !== 'ADMIN2024') {
      return NextResponse.json(
        { error: 'Invalid admin code' },
        { status: 403 }
      );
    }

    // Here you would save to database
    // For demo purposes, we just validate

    return NextResponse.json(
      { message: 'User registered successfully' },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
