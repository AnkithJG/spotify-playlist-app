'use client';

import { useState, useEffect } from 'react';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  external_urls: { spotify: string };
}

export default function Home() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');

    if (token) {
      setAccessToken(token);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchPlaylists() {
      try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch playlists');
        }

        const data = await response.json();
        setPlaylists(data.items);
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchPlaylists();
  }, [accessToken]);

  if (!accessToken) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h1>Please log in to continue</h1>
        <a
          href="/api/login"
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#1DB954',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
          }}
        >
          Log in with Spotify
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem', color: 'red' }}>
        <h1>Error</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 600, margin: 'auto' }}>
      <h1>Your Spotify Playlists</h1>
      {playlists.length === 0 && <p>Loading playlists...</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {playlists.map((playlist) => (
          <li key={playlist.id} style={{ marginBottom: '1rem' }}>
            <a
              href={playlist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', color: '#1DB954', fontWeight: 'bold' }}
            >
              {playlist.name}
            </a>
            {playlist.images[0] && (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                style={{ width: 150, marginTop: 8, borderRadius: 8 }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
