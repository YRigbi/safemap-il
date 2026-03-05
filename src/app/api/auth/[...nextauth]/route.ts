import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import LinkedInProvider from 'next-auth/providers/linkedin'

const handler = NextAuth({
    providers: [
          GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID ?? 'x', clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? 'x' }),
          FacebookProvider({ clientId: process.env.FACEBOOK_CLIENT_ID ?? 'x', clientSecret: process.env.FACEBOOK_CLIENT_SECRET ?? 'x' }),
          LinkedInProvider({ clientId: process.env.LINKEDIN_CLIENT_ID ?? 'x', clientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? 'x' }),
        ],
    secret: process.env.NEXTAUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: { signIn: '/login', error: '/login' },
})

export { handler as GET, handler as POST }
