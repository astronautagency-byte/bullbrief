interface FavouritePodcast {
  id: string;
  title: string;
  description?: string;
  artworkUrl?: string;
  categories: string[];
  addedAt: string;
}

const favourites = new Map<string, FavouritePodcast>();

export function getFavourites(): FavouritePodcast[] {
  return Array.from(favourites.values()).sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  );
}

export function addFavourite(podcast: {
  id: string;
  title: string;
  description?: string;
  artworkUrl?: string;
  categories?: string[];
}): { added: boolean; podcast: FavouritePodcast } {
  if (favourites.has(podcast.id)) {
    return { added: false, podcast: favourites.get(podcast.id)! };
  }

  const entry: FavouritePodcast = {
    id: podcast.id,
    title: podcast.title,
    description: podcast.description,
    artworkUrl: podcast.artworkUrl,
    categories: podcast.categories ?? [],
    addedAt: new Date().toISOString(),
  };

  favourites.set(podcast.id, entry);
  return { added: true, podcast: entry };
}

export function removeFavourite(id: string): boolean {
  return favourites.delete(id);
}

export function isFavourite(id: string): boolean {
  return favourites.has(id);
}
