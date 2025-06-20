'use client';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import PlaylistSelector from './modules/PlaylistSelector'; 

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');

    if (token) {
      setAccessToken(token);
      window.history.replaceState({}, '', window.location.pathname); // remove token from URL
    }
  }, []);

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-screen">
        <a
          href="/api/login"
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded"
        >
          Log in with Spotify
        </a>
      </div>
    );
  }

  return (
      <PlaylistSelector
        accessToken={accessToken}
        onPlaylistsCompared={({ common, only1, only2 }) => {
          console.log('Common tracks:', common);
          console.log('Only in Playlist 1:', only1);
          console.log('Only in Playlist 2:', only2);
        }}
      />
  );
}

