'use client';

//force
//testing 
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Music, ArrowRight, Link2, Lock, Globe, Sparkles } from "lucide-react"
//import { VennDiagram } from "./venn-diagram"

type Playlist = {
  id: string;
  name: string;
};

type Props = {
  accessToken: string; 
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

async function fetchPlaylistCover(playlistId: string, token: string): Promise<string | null> {
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.images?.[0]?.url || null;
}

export default function PlaylistSelector({ accessToken, onPlaylistsCompared }: Props) {
  const [selectionMode, setSelectionMode] = useState<('public' | 'private')[]>(['public', 'public']);
  const [playlistInputs, setPlaylistInputs] = useState(['', '']);
  const [privatePlaylists, setPrivatePlaylists] = useState<Playlist[]>([]);
  const [playlistImages, setPlaylistImages] = useState<(string | null)[]>([null, null]);

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

  // Fetch cover images when playlistInputs or selectionMode changes
  useEffect(() => {
    const fetchImages = async () => {
      const newImages = await Promise.all([0, 1].map(async (idx) => {
        const input = playlistInputs[idx];
        if (!input) return null;
        const id = selectionMode[idx] === 'public' ? extractId(input) : input;
        if (!id) return null;
        try {
          return await fetchPlaylistCover(id, accessToken);
        } catch {
          return null;
        }
      }));
      setPlaylistImages(newImages);
    };
    fetchImages();
  }, [playlistInputs, selectionMode, accessToken]);

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
    <div className="min-h-screen bg-gradient-to-br from-[#191414] via-[#1a1a1a] to-[#0d1117] text-white">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/20 to-transparent" />
        <div className="relative px-6 py-12 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-[#1DB954]/20 blur-xl animate-pulse" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1DB954] shadow-lg shadow-[#1DB954]/25">
                  <Music className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h1 className="mb-4 text-5xl font-bold tracking-tight">
              Playlist <span className="text-[#1DB954]">Comparer</span>
            </h1>
            <p className="text-xl text-gray-300">Compare your Spotify playlists and discover the differences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-12">
        <div className="mx-auto max-w-4xl">
          <Card className="border-gray-800 bg-[#1a1a1a]/50 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Playlist 1 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Playlist 1 Cover */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/20">
                      <Music className="h-5 w-5 text-[#1DB954]" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-white">First Playlist</Label>
                      <Select
                        value={selectionMode[0]}
                        onValueChange={(value: 'public' | 'private') => {
                          const newModes = [...selectionMode];
                          newModes[0] = value;
                          setSelectionMode(newModes);
                          handleChange(0, '');
                        }}
                      >
                        <SelectTrigger className="border-gray-700 bg-[#2a2a2a] text-white focus:border-[#1DB954] focus:ring-[#1DB954]/20">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-[#2a2a2a] text-white [&_[data-highlighted]]:bg-[#3a3a3a] [&_[data-highlighted]]:text-white">
                          <SelectItem value="public">Public (link)</SelectItem>
                          <SelectItem value="private">Private (library)</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectionMode[0] === 'public' ? (
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="Enter a playlist link!"
                            value={playlistInputs[0]}
                            onChange ={e => handleChange(0, e.target.value)}
                            className="border-gray-700 bg-[#2a2a2a] pl-10 text-white placeholder:text-gray-500 focus:border-[#1DB954] focus:ring-[#1DB954]/20"
                          />
                        </div>
                      ) : (
                        <Select
                          value={playlistInputs[0]}
                          onValueChange={(value) => handleChange(0, value)}
                        >
                          <SelectTrigger className="border-gray-700 bg-[#2a2a2a] text-white focus:border-[#1DB954] focus:ring-[#1DB954]/20">
                            <SelectValue placeholder="Select from your library" />
                          </SelectTrigger>
                          <SelectContent 
                            side="bottom" 
                            className="max-h-48 overflow-y-auto border-gray-700 bg-[#2a2a2a] text-white [&_[data-highlighted]]:bg-[#3a3a3a] [&_[data-highlighted]]:text-white"
                          >
                            <SelectItem value="placeholder" disabled>Select from your library</SelectItem>
                            {privatePlaylists.map((p) => (
                              <SelectItem key={p.id} value={p.id} >
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {playlistImages[0] && (
                      <img
                        src={playlistImages[0]}
                        alt="Playlist 1 Cover"
                        className="h-16 w-16 rounded shadow-lg object-cover"
                      />
                    )}
                    </div>
                  </div>
                </div>
                {/* VS Divider */}
                <div className="flex items-center justify-center lg:col-span-2">
                  <div className="flex items-center gap-4">
                    <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-600" />
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1DB954] shadow-lg shadow-[#1DB954]/25">
                      <span className="text-sm font-bold text-white">VS</span>
                    </div>
                    <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-600" />
                  </div>
                </div>
                {/* Playlist 2 */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Playlist 2 Cover */}
                    {playlistImages[1] && (
                      <img
                        src={playlistImages[1]}
                        alt="Playlist 2 Cover"
                        className="h-16 w-16 rounded shadow-lg object-cover"
                      />
                    )}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1DB954]/20">
                      <Music className="h-5 w-5 text-[#1DB954]" />
                    </div>
                    <div>
                      <Label className="text-lg font-semibold text-white">Second Playlist</Label>
                      <Select
                        value={selectionMode[1]}
                        onValueChange={(value: 'public' | 'private') => {
                          const newModes = [...selectionMode];
                          newModes[1] = value;
                          setSelectionMode(newModes);
                          handleChange(1, '');
                        }}
                      >
                        <SelectTrigger className="border-gray-700 bg-[#2a2a2a] text-white focus:border-[#1DB954] focus:ring-[#1DB954]/20">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-[#2a2a2a] text-white [&_[data-highlighted]]:bg-[#3a3a3a] [&_[data-highlighted]]:text-white">
                          <SelectItem value="public">Public (link)</SelectItem>
                          <SelectItem value="private">Private (library)</SelectItem>
                        </SelectContent>
                      </Select>

                      {selectionMode[1] === 'public' ? (
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            placeholder="Enter a playlist link!"
                            value={playlistInputs[1]}
                            onChange ={e => handleChange(1, e.target.value)}
                            className="border-gray-700 bg-[#2a2a2a] pl-10 text-white placeholder:text-gray-500 focus:border-[#1DB954] focus:ring-[#1DB954]/20"
                          />
                        </div>
                      ) : (
                        <Select
                          value={playlistInputs[1]}
                          onValueChange={(value) => handleChange(1, value)}
                        >
                          <SelectTrigger className="border-gray-700 bg-[#2a2a2a] text-white focus:border-[#1DB954] focus:ring-[#1DB954]/20">
                            <SelectValue placeholder="Select from your library" />
                          </SelectTrigger>
                          <SelectContent 
                            side="bottom" 
                            className="max-h-48 overflow-y-auto border-gray-700 bg-[#2a2a2a] text-white [&_[data-highlighted]]:bg-[#3a3a3a] [&_[data-highlighted]]:text-white"
                          >
                            <SelectItem value="placeholder" disabled>Select from your library</SelectItem>
                            {privatePlaylists.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {/* Compare Button
              <div className="mt-8 flex justify-center">
                <Button
                  onClick={handleConfirmBoth}
                  disabled={
                    !(
                      (selectionMode[0] === 'public' ? extractId(playlistInputs[0]) : playlistInputs[0]) &&
                      (selectionMode[1] === 'public' ? extractId(playlistInputs[1]) : playlistInputs[1])
                    )
                  }
                  className="group relative h-14 px-8 bg-[#1DB954] text-white font-semibold text-lg hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#1DB954]/25 hover:shadow-[#1DB954]/40"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
                    <span>Compare Playlists</span>
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Button>
              </div> */}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
  )
}
