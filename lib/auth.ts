import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import db from './database';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // TODO: Implement proper password hashing (e.g., bcrypt or argon2)
        // For now, using plain text comparison for admin user as a temporary solution.
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          // In a real app, you would fetch user from the database
          // For this project, we'll create a static admin user object
          const user = {
            id: '1',
            name: 'Admin',
            email: `${adminUsername}@example.com`,
            role: 'admin'
          };
          return user;
        }

        return null;
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if (user.role) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role as string;
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login', 
  }
};
