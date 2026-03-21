const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FlightSearchRequest {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  passengers: number;
  keyword?: string;
}

interface DuffelSlice {
  origin: string;
  destination: string;
  departure_date: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const DUFFEL_API_KEY = Deno.env.get("DUFFEL_API_KEY");
    if (!DUFFEL_API_KEY) throw new Error("DUFFEL_API_KEY not configured");

    const body: FlightSearchRequest = await req.json();
    const { origin, destination, departure_date, return_date, passengers, keyword } = body;

    if (!origin) return new Response(JSON.stringify({ error: "missing_param", message: "What city are you flying from?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!destination) return new Response(JSON.stringify({ error: "missing_param", message: "What city are you flying to?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!departure_date) return new Response(JSON.stringify({ error: "missing_param", message: "What date are you flying?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!passengers) return new Response(JSON.stringify({ error: "missing_param", message: "How many passengers are traveling?" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build slices for the Duffel offer request
    const slices: DuffelSlice[] = [
      {
        origin,
        destination,
        departure_date,
      },
    ];

    if (return_date) {
      slices.push({
        origin: destination,
        destination: origin,
        departure_date: return_date,
      });
    }

    // Build passenger list
    const passengerList = Array.from({ length: passengers }, () => ({ type: "adult" as const }));

    // Create offer request with Duffel API
    const offerRes = await fetch("https://api.duffel.com/air/offer_requests", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_API_KEY}`,
        "Duffel-Version": "v2",
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        data: {
          slices,
          passengers: passengerList,
          cabin_class: "economy",
        },
      }),
    });

    if (!offerRes.ok) {
      const errorBody = await offerRes.text();
      console.error("Duffel API error:", offerRes.status, errorBody);
      return new Response(
        JSON.stringify({ error: "no_results", message: "No flights found for these dates. Try different dates or a nearby airport.", flights: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const offerData = await offerRes.json();
    const offers = offerData.data?.offers ?? [];

    // Map Duffel offers to our response format
    const flights = offers.map((offer: any) => {
      const outboundSlice = offer.slices?.[0];
      const firstSegment = outboundSlice?.segments?.[0];
      const lastSegment = outboundSlice?.segments?.[outboundSlice.segments.length - 1];
      const carrier = firstSegment?.operating_carrier ?? firstSegment?.marketing_carrier ?? {};

      // Calculate total duration in minutes from the slice duration
      const durationIso = outboundSlice?.duration;
      let durationMinutes = 0;
      if (durationIso) {
        const match = durationIso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
        if (match) {
          durationMinutes = (parseInt(match[1] || "0") * 60) + parseInt(match[2] || "0");
        }
      }

      const priceCents = Math.round(parseFloat(offer.total_amount) * 100);

      // Build flight number from carrier code + flight number
      const carrierCode = firstSegment?.operating_carrier?.iata_code ?? firstSegment?.marketing_carrier?.iata_code ?? "";
      const flightNum = firstSegment?.operating_carrier_flight_number ?? firstSegment?.marketing_carrier_flight_number ?? "";
      const flightNumber = carrierCode && flightNum ? `${carrierCode}${flightNum}` : null;

      return {
        id: offer.id,
        airline_name: carrier.name ?? "Unknown Airline",
        airline_logo_url: carrier.logo_symbol_url ?? carrier.logo_lockup_url ?? null,
        flight_number: flightNumber,
        departure_time: firstSegment?.departing_at ?? null,
        arrival_time: lastSegment?.arriving_at ?? null,
        duration_minutes: durationMinutes,
        stops: (outboundSlice?.segments?.length ?? 1) - 1,
        price_cents: priceCents,
        currency: offer.total_currency ?? "USD",
        cabin_class: firstSegment?.passengers?.[0]?.cabin_class ?? "economy",
        booking_token: offer.id,
        passenger_ids: offer.passengers?.map((p: any) => p.id) ?? [],
      };
    });

    // Filter by keyword (airline name) if provided — prioritize matches, keep others as alternatives
    let filtered = flights;
    if (keyword) {
      const kw = keyword.toLowerCase();
      const matches = flights.filter((f: any) => f.airline_name.toLowerCase().includes(kw));
      filtered = matches.length > 0 ? matches : flights;
    }

    return new Response(JSON.stringify({ flights: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-flights error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
