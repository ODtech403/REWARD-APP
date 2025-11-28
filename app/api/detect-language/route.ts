import { NextRequest, NextResponse } from 'next/server'
import type { LanguageCode } from '@/lib/stores/languageStore'

// Country to language mapping
const COUNTRY_TO_LANGUAGE: Record<string, LanguageCode> = {
  // English
  US: 'en', GB: 'en', AU: 'en', CA: 'en', NZ: 'en', IE: 'en',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', CL: 'es', VE: 'es', EC: 'es',
  // French
  FR: 'fr', BE: 'fr', CH: 'fr', CA: 'fr', SN: 'fr', CI: 'fr',
  // German
  DE: 'de', AT: 'de',
  // Portuguese
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh', SG: 'zh',
  // Arabic
  SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', IQ: 'ar', JO: 'ar', KW: 'ar',
  // Hindi
  IN: 'hi',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', UA: 'ru',
  // Japanese
  JP: 'ja',
}

export async function GET(request: NextRequest) {
  try {
    // Try to get country from various headers
    const cfCountry = request.headers.get('cf-ipcountry')
    const vercelCountry = request.headers.get('x-vercel-ip-country')
    const forwardedFor = request.headers.get('x-forwarded-for')
    
    let countryCode = cfCountry || vercelCountry
    
    // If no country header, try IP geolocation API
    if (!countryCode && forwardedFor) {
      const ip = forwardedFor.split(',')[0].trim()
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`)
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          countryCode = geoData.countryCode
        }
      } catch {
        // Geolocation failed, use default
      }
    }

    // Get language from country code
    const detectedLanguage: LanguageCode = countryCode 
      ? (COUNTRY_TO_LANGUAGE[countryCode.toUpperCase()] || 'en')
      : 'en'

    return NextResponse.json({
      language: detectedLanguage,
      country: countryCode || 'unknown',
      detected: !!countryCode,
    })
  } catch (error) {
    console.error('Language detection error:', error)
    return NextResponse.json({
      language: 'en',
      country: 'unknown',
      detected: false,
    })
  }
}
