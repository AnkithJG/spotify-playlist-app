import { NextResponse } from 'next/server';

export async function GET() {
  const scopes = [
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-top-read'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: scopes,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  const redirectUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  return NextResponse.redirect(redirectUrl);
}
