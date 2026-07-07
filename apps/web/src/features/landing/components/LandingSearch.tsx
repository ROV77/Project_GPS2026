import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExploreSearchBar } from '@/features/explore/components/ExploreSearchBar';

export function LandingSearch() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [communeId, setCommuneId] = useState<string | null>(null);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('q', keyword.trim());
    if (regionId) params.set('region_id', regionId);
    if (communeId) params.set('commune_id', communeId);
    const qs = params.toString();
    navigate(qs ? `/explorar?${qs}` : '/explorar');
  };

  return (
    <ExploreSearchBar
      keyword={keyword}
      onKeywordChange={setKeyword}
      regionId={regionId}
      onRegionChange={setRegionId}
      communeId={communeId}
      onCommuneChange={setCommuneId}
      onSubmit={handleSearch}
    />
  );
}
