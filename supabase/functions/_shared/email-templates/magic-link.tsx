/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({ siteName, confirmationUrl }: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Traviso login link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src="https://hmogswuliehwbmcyzfie.supabase.co/storage/v1/object/public/email-assets/traviso-logo.png" width="140" height="auto" alt="Traviso" />
        </Section>
        <Heading style={h1}>Your login link</Heading>
        <Text style={text}>Tap the button below to sign in to Traviso. This link expires shortly, so use it soon.</Text>
        <Section style={buttonContainer}>
          <Button style={button} href={confirmationUrl}>Sign In</Button>
        </Section>
        <Text style={footer}>Didn't request this? You can safely ignore this email.</Text>
        <Text style={footerBrand}>© Traviso · Plan it, book it, get paid.</Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '40px 25px 30px', maxWidth: '480px', margin: '0 auto' }
const logoSection = { marginBottom: '30px' }
const h1 = { fontSize: '24px', fontWeight: '700' as const, color: '#131B26', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#6A7080', lineHeight: '1.6', margin: '0 0 20px' }
const buttonContainer = { margin: '8px 0 30px' }
const button = { backgroundColor: '#29A38B', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '13px', color: '#999999', margin: '0 0 8px' }
const footerBrand = { fontSize: '12px', color: '#CCCCCC', margin: '0' }
