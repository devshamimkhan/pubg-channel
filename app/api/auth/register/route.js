import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  whatsappNumber: z.string().min(10, 'WhatsApp number must be at least 10 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return Response.json({ success: false, message: result.error.errors[0].message }, { status: 400 });
    }

    const { fullName, whatsappNumber, password } = result.data;

    await connectDB();

    // Check if user exists
    const existingUser = await User.findOne({ whatsappNumber });
    if (existingUser) {
      return Response.json({ success: false, message: 'A user with this WhatsApp number already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    await User.create({
      fullName,
      whatsappNumber,
      password: hashedPassword,
      role: 'user', // Default role
    });

    return Response.json({ success: true, message: 'Registration successful' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
