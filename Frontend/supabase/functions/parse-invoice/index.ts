import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const SYSTEM_PROMPT = `You read vendor invoices for a grocery store and return json.
Extract the invoice header and every product line item.
Return ONLY a json object with this exact shape:
{
  "vendor": string,
  "invoice_number": string,
  "invoice_date": string (YYYY-MM-DD, empty string if unknown),
  "lines": [
    {
      "description": string,
      "sku": string,
      "barcode": string,
      "quantity": number,
      "unit_type": "item" | "case",
      "units_per_case": number,
      "unit_cost": number,
      "line_total": number
    }
  ]
}
Rules: use empty strings for unknown text, 0 for unknown numbers, 1 for unknown units_per_case.
unit_type is "case" only when the line is clearly billed by case/carton. Never invent lines that are not on the invoice.
Skip freight, tax, discount and other non-product charge rows.`

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
      return json({ error: 'Only PDF, JPG and PNG invoices can be read.' }, 400)
    }

    const dataUrl = `data:${mimeType};base64,${fileData}`
    const contentBlock = isImage
      ? { type: 'image_url', image_url: { url: dataUrl } }
      : {
          type: 'file',
          file: { filename: typeof fileName === 'string' ? fileName : 'invoice.pdf', file_data: dataUrl },
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
              { type: 'text', text: 'Extract this invoice as json using the required shape.' },
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
      return json({ error: 'The invoice could not be read. Try a clearer file or enter it manually.' }, 502)
    }

    const payload = await res.json()
    const raw: string = payload?.choices?.[0]?.message?.content ?? ''
    let parsed: any
    try {
      parsed = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) {
        return json({ error: 'Nothing recognisable was found on this invoice.' }, 422)
      }
      parsed = JSON.parse(match[0])
    }

    const num = (v: unknown) => {
      const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[^0-9.\-]/g, ''))
      return Number.isFinite(n) ? n : 0
    }
    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

    const lines = Array.isArray(parsed?.lines)
      ? parsed.lines
          .map((l: any) => {
            const quantity = Math.max(0, Math.round(num(l?.quantity)))
            const unitCost = num(l?.unit_cost)
            const lineTotal = num(l?.line_total) || quantity * unitCost
            return {
              description: str(l?.description),
              sku: str(l?.sku),
              barcode: str(l?.barcode),
              quantity,
              unitType: l?.unit_type === 'case' ? 'case' : 'item',
              unitsPerCase: Math.max(1, Math.round(num(l?.units_per_case)) || 1),
              unitCost: unitCost || (quantity ? lineTotal / quantity : 0),
              lineTotal,
            }
          })
          .filter((l: any) => l.description)
      : []

    if (lines.length === 0) {
      return json({ error: 'No product lines were found on this invoice.' }, 422)
    }

    return json({
      vendor: str(parsed?.vendor),
      invoiceNumber: str(parsed?.invoice_number),
      invoiceDate: /^\d{4}-\d{2}-\d{2}$/.test(str(parsed?.invoice_date)) ? str(parsed.invoice_date) : '',
      lines,
    })
  } catch (e) {
    console.error(e)
    return json({ error: 'Something went wrong while reading the invoice.' }, 500)
  }
})
