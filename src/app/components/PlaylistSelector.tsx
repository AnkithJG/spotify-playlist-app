import { useEffect, useState } from 'react';

// Define the shape of a simplified playlist object
type Playlist = {
  id: string;
  name: string;
};

// Props passed into this component
type Props = {
  accessToken: string; // Spotify access token, used to fetch private playlists
  onPlaylistsSelected: (index: number, playlistId: string) => void; // Callback when a playlist is selected
};

export default function PlaylistSelector({ accessToken, onPlaylistsSelected }: Props) {
  // Keep track of whether each of the two playlists is selected as "public" or "private"
  const [selectionMode, setSelectionMode] = useState<('public' | 'private')[]>(['public', 'public']);

  // Store either the pasted URL (for public) or selected ID (for private) for each playlist
  const [playlistInputs, setPlaylistInputs] = useState(['', '']);

  // Store the list of user's private playlists (fetched from Spotify)
  const [privatePlaylists, setPrivatePlaylists] = useState<Playlist[]>([]);

  // Fetch user's playlists from Spotify once accessToken is available
  useEffect(() => {
    if (!accessToken) return;

    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data?.items) {
          // Simplify the playlist objects: only keep id and name
          const playlists = data.items.map((p: any) => ({ id: p.id, name: p.name }));
          setPrivatePlaylists(playlists); // Store in state
        }
      });
  }, [accessToken]); // Runs again if accessToken changes

  // Extract playlist ID from a public Spotify playlist URL
  const extractId = (url: string) => {
    const match = url.match(/playlist\/([a-zA-Z0-9]+)/); // Look for `playlist/{id}` pattern
    return match?.[1] || ''; // Return the ID, or empty string if not found
  };

  // Update the input (URL or selected ID) for a specific playlist (0 or 1)
  const handleChange = (index: number, value: string) => {
    const copy = [...playlistInputs]; // Copy the current inputs
    copy[index] = value; // Update the relevant one
    setPlaylistInputs(copy); // Save to state
  };

  // When the user clicks "Confirm" for a playlist,
  // determine whether to extract ID from URL or use selected private ID
  const handleConfirm = (index: number) => {
    const id = selectionMode[index] === 'public'
      ? extractId(playlistInputs[index]) // extract from URL
      : playlistInputs[index]; // use directly (for private)

    // Call the callback with the selected playlist ID
    if (id) onPlaylistsSelected(index, id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {[0, 1].map((idx) => (
        <div key={idx} className="p-4 border rounded-xl shadow space-y-2">
          <h2 className="font-bold text-lg">Playlist {idx + 1}</h2>
          <select
            className="w-full p-2 border rounded"
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
              className="w-full p-2 border rounded"
              placeholder="Paste playlist link"
              value={playlistInputs[idx]}
              onChange={e => handleChange(idx, e.target.value)}
            />
          ) : (
            <select
              className="w-full p-2 border rounded"
              value={playlistInputs[idx]}
              onChange={e => handleChange(idx, e.target.value)}
            >
              <option value="">Select from your library</option>
              {privatePlaylists.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          <button
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
            onClick={() => handleConfirm(idx)}
          >
            Confirm
          </button>
        </div>
      ))}
    </div>
  );
}
