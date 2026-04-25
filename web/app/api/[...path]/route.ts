import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3099";

async function proxyRequest(request: NextRequest) {
  const url = new URL(request.url);
  const backendUrl = `${API_URL}${url.pathname}${url.search}`;

  const headers = new Headers();
  for (const [key, value] of request.headers.entries()) {
    if (
      key !== "host" &&
      key !== "connection" &&
      key !== "transfer-encoding"
    ) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (
    request.method !== "GET" &&
    request.method !== "HEAD" &&
    request.method !== "OPTIONS"
  ) {
    init.body = request.body;
    // @ts-expect-error -- Node fetch supports duplex streaming
    init.duplex = "half";
  }

  try {
    const response = await fetch(backendUrl, init);

    const responseHeaders = new Headers();
    for (const [key, value] of response.headers.entries()) {
      if (
        key !== "transfer-encoding" &&
        key !== "connection" &&
        key !== "content-encoding"
      ) {
        responseHeaders.set(key, value);
      }
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: "Backend service unavailable" },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}
