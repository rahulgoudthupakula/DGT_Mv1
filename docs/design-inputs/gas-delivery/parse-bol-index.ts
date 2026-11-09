import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SYSTEM_PROMPT = `You read fuel Bills of Lading (BOL) from petroleum terminals and return json.
A BOL has a header (BOL number, terminal/shipment origin, supplier, customer, carrier, driver, tractor/trailer, load times)
and a product table with one row per compartment (product code, description, octane, gross gallons, net gallons, temperature, gravity, meter, compartment).
Return ONLY a json object with this exact shape:
{
  "bol_number": string,
  "folio": string,
  "terminal": string,
  "supplier": string,
  "customer": string,
  "destination": string,
  "carrier": string,
  "driver": string,
  "tractor": string,
  "trailer": string,
  "load_date": string (YYYY-MM-DD, empty string if unknown),
  "load_time": string (HH:MM 24h, empty string if unknown),
  "lines": [
    {
      "product_code": string,
      "description": string,
      "octane": string,
      "gross_gallons": number,
      "net_gallons": number,
      "temperature": number,
      "gravity": number,
      "meter": string,
      "compartment": string
    }
  ]
}
Rules: use empty strings for unknown text and 0 for unknown numbers. A BOL carries no prices — never invent cost.
Skip the PRODUCT TOTALS row. Never invent lines that are not on the document.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) return json({ error: 'AI is not configured.' }, 500)

    const body = await req.json().catch(() => null)
    const fileData: unknown = body?.fileData
    const mimeType: unknown = body?.mimeType
    const fileName: unknown = body?.fileName

    if (typeof fileData !== 'string' || fileData.length < 100) {
      return json({ error: 'No readable file was uploaded.' }, 400)
    }
    if (typeof mimeType !== 'string' || !mimeType) {
      return json({ error: 'The file type is missing.' }, 400)
    }

    const isImage = mimeType.startsWith('image/')
    const isPdf = mimeType === 'application/pdf'
    if (!isImage && !isPdf) {
      return json({ error: 'Only PDF, JPG and PNG files can be read.' }, 400)
    }

    const dataUrl = `data:${mimeType};base64,${fileData}`
    const contentBlock = isImage
      ? { type: 'image_url', image_url: { url: dataUrl } }
      : {
          type: 'file',
          file: { filename: typeof fileName === 'string' ? fileName : 'bol.pdf', file_data: dataUrl },
        }

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': apiKey,
        'X-Lovable-AIG-SDK': 'fetch',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.7-flash',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extract this bill of lading as json using the required shape.' },
              contentBlock,
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('gateway error', res.status, detail)
      if (res.status === 429) {
        return json({ error: 'Too many requests right now. Please try again in a moment.' }, 429)
      }
      if (res.status === 402) {
        return json({ error: 'AI credits are exhausted. Please add credits to continue.' }, 402)
      }
      return json({ error: 'The BOL could not be read. Try a clearer photo or enter it manually.' }, 502)
    }

    const payload = await res.json()
    const raw: string = payload?.choices?.[0]?.message?.content ?? ''
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) return json({ error: 'Nothing recognisable was found on this BOL.' }, 422)
      parsed = JSON.parse(match[0])
    }

    const num = (v: unknown) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
      return Number.isFinite(n) ? n : 0
    }
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

    const lines = Array.isArray(parsed?.lines)
      ? parsed.lines
          .map((l: any) => ({
            productCode: str(l?.product_code),
            description: str(l?.description),
            octane: str(l?.octane),
            grossGallons: num(l?.gross_gallons),
            netGallons: num(l?.net_gallons),
            temperature: num(l?.temperature),
            gravity: num(l?.gravity),
            meter: str(l?.meter),
            compartment: str(l?.compartment),
          }))
          .filter((l: any) => l.description || l.grossGallons > 0)
      : []

    if (lines.length === 0) {
      return json({ error: 'No product lines were found on this BOL.' }, 422)
    }

    return json({
      bolNumber: str(parsed?.bol_number),
      folio: str(parsed?.folio),
      terminal: str(parsed?.terminal),
      supplier: str(parsed?.supplier),
      customer: str(parsed?.customer),
      destination: str(parsed?.destination),
      carrier: str(parsed?.carrier),
      driver: str(parsed?.driver),
      tractor: str(parsed?.tractor),
      trailer: str(parsed?.trailer),
      loadDate: /^\d{4}-\d{2}-\d{2}$/.test(str(parsed?.load_date)) ? str(parsed.load_date) : '',
      loadTime: str(parsed?.load_time),
      lines,
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Something went wrong while reading the BOL.' }, 500)
  }
})
