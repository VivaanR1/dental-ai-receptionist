import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Allow our old/simple test format too
    if (body.full_name) {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          full_name: body.full_name,
          phone: body.phone,
          reason: body.reason,
          preferred_time: body.preferred_time || null,
          status: "New",
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        lead: data,
      });
    }

    // Vapi custom-tool format
    const toolCall =
      body.message?.toolCallList?.[0] ??
      body.message?.toolCalls?.[0] ??
      body.toolCallList?.[0] ??
      body.toolCalls?.[0];

    if (!toolCall) {
      return NextResponse.json(
        { error: "No tool call found." },
        { status: 400 }
      );
    }

    const toolCallId = toolCall.id;

    const args =
      toolCall.function?.arguments ??
      toolCall.arguments ??
      {};

    const {
      full_name,
      phone,
      reason,
      preferred_time,
    } = args;

    if (!full_name || !phone || !reason) {
      return NextResponse.json({
        results: [
          {
            toolCallId,
            result:
              "The lead could not be saved because required information was missing.",
          },
        ],
      });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        full_name,
        phone,
        reason,
        preferred_time: preferred_time || null,
        status: "New",
      })
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json({
        results: [
          {
            toolCallId,
            result: `The lead could not be saved: ${error.message}`,
          },
        ],
      });
    }

    return NextResponse.json({
      results: [
        {
          toolCallId,
          result: JSON.stringify({
            success: true,
            lead_id: data.id,
            message: "Lead saved successfully.",
          }),
        },
      ],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Invalid request." },
      { status: 400 }
    );
  }
}