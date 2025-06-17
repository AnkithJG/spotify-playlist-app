import { useEffect, useState } from 'react';

//testing

// Define the shape of a simplified playlist object
type Playlist = {
  id: string;
  name: string;
};

// Props passed into this component
type Props = {
  accessToken: string; // Spotify access token, used to fetch private playlists
  onPlaylistsCompared: (result: {
    common: NormalizedTrack[];
    only1: NormalizedTrack[];
    only2: NormalizedTrack[];
  }) => void;
};

type NormalizedTrack = {
  id: string;
  name: string;
  artist: string;
};

async function fetchTracks(playlistId: string, token: string): Promise<NormalizedTrack[]> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  return data.items
    .filter((item: any) => item.track !== null)
    .map((item: any) => ({
      id: item.track.id,
      name: item.track.name,
      artist: item.track.artists.map((a: any) => a.name).join(', ')
    }));

}

export default function PlaylistSelector({ accessToken, onPlaylistsCompared }: Props) {
  const [selectionMode, setSelectionMode] = useState<('public' | 'private')[]>(['public', 'public']);
  const [playlistInputs, setPlaylistInputs] = useState(['', '']);
  const [privatePlaylists, setPrivatePlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    if (!accessToken) return;

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.items) {
          const playlists = data.items.map((p: any) => ({ id: p.id, name: p.name }));
          setPrivatePlaylists(playlists);
        }
      });
  }, [accessToken]);

  const extractId = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
    return match?.[1] || '';
  };

  const handleChange = (index: number, value: string) => {
    const copy = [...playlistInputs];
    copy[index] = value;
    setPlaylistInputs(copy);
  };

  const handleConfirmBoth = async () => {
    const playlist1Id = selectionMode[0] === 'public'
      ? extractId(playlistInputs[0])
      : playlistInputs[0];

    const playlist2Id = selectionMode[1] === 'public'
      ? extractId(playlistInputs[1])
      : playlistInputs[1];

    if (!playlist1Id || !playlist2Id) return;

    try {
      const [tracks1, tracks2] = await Promise.all([
        fetchTracks(playlist1Id, accessToken),
        fetchTracks(playlist2Id, accessToken)
      ]);

      const ids1 = new Set(tracks1.map(t => t.id));
      const ids2 = new Set(tracks2.map(t => t.id));

      const common = tracks1.filter(t => ids2.has(t.id));
      const only1 = tracks1.filter(t => !ids2.has(t.id));
      const only2 = tracks2.filter(t => !ids1.has(t.id));

      onPlaylistsCompared({ common, only1, only2 });
    } catch (err) {
      console.error("Error comparing playlists:", err);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-xl shadow-lg">
      <div className="space-y-6">
        {[0, 1].map((idx) => (
          <div key={idx} className="space-y-2">
            <h2 className="font-bold text-lg text-white">Playlist {idx + 1}</h2>
            <select
              className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
              value={selectionMode[idx]}
              onChange={e => {
                const newModes = [...selectionMode];
                newModes[idx] = e.target.value as 'public' | 'private';
                setSelectionMode(newModes);
                handleChange(idx, '');
              }}
            >
              <option value="public">Public (link)</option>
              <option value="private">Private (library)</option>
            </select>

            {selectionMode[idx] === 'public' ? (
              <input
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white placeholder-gray-400"
                placeholder="Paste playlist link"
                value={playlistInputs[idx]}
                onChange={e => handleChange(idx, e.target.value)}
              />
            ) : (
              <select
                className="w-full p-2 border border-gray-600 rounded bg-gray-700 text-white"
                value={playlistInputs[idx]}
                onChange={e => handleChange(idx, e.target.value)}
              >
                <option value="" className="text-gray-400">Select from your library</option>
                {privatePlaylists.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>
        ))}

        <button
          className="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded w-full text-lg font-semibold"
          onClick={handleConfirmBoth}
        >
          Compare Playlists
        </button>
      </div>
    </div>
  );
}
