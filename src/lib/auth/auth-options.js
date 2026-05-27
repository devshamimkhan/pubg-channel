import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db/mongoose';
import User from '@/lib/db/models/User';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        whatsappNumber: { label: "WhatsApp Number", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.whatsappNumber || !credentials?.password) {
          throw new Error('Please enter your WhatsApp number and password.');
        }

        await connectDB();

        const user = await User.findOne({ whatsappNumber: credentials.whatsappNumber });

        if (!user) {
          throw new Error('No user found with this WhatsApp number.');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password.');
        }

        await User.findByIdAndUpdate(user._id, {
          isOnline: true,
          lastSeenAt: new Date(),
        });

        return {
          id: user._id.toString(),
          name: user.fullName,
          whatsappNumber: user.whatsappNumber,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.whatsappNumber = user.whatsappNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.whatsappNumber = token.whatsappNumber;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
};
