/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Traviso verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo.png" width="140" height="auto" alt="Traviso" />
        </Section>
        <Heading style={h1}>Verification code</Heading>
        <Text style={text}>Use this code to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>This code expires shortly. If you didn't request this, ignore this email.</Text>
        <Text style={footerBrand}>© Traviso · Plan it, book it, get paid.</Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 25px 30px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '30px' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#131B26', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#6A7080', lineHeight: '1.6', margin: '0 0 20px' }
const codeStyle = { fontFamily: "'DM Sans', Courier, monospace", fontSize: '28px', fontWeight: '700' as const, color: '#29A38B', letterSpacing: '4px', margin: '0 0 30px' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#CCCCCC', margin: '0' }
