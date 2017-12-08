import { Dictionary } from './dictionary.js';

/**
 * Tracks most frequently(recently?) used files.
 * Currently uses IndexedDB to store data
 */
export class FavoritesTracker {
  constructor() {
    // Wait 5 minutes before refreshing the favorites
    FavoritesTracker._minRefreshTime = 5 * 60 * 1000;
    this._responseDb = new Dictionary('response-cache');
    this._favoritesDb = new Dictionary('favorites');
    this._favoritesDb.onconnect = this._checkFavorites.bind(this);
  }
  
  /**
   * Load favorites by descending popularity
   */
  async _checkFavorites() {
    this.favorites = await this._favoritesDb.toArray();
    
    // Sort favorites by descending popularity
    this.favorites.sort(function(first, second) {
      return second[1].value - first[1].value;
    });
    
    for (let favorit of this.favorites) {
      let entry = await this._responseDb.match("GET " + favorit[0]);
      
      if (entry != null && Date.now() - entry.timestamp < FavoritesTracker._minRefreshTime) continue;
      
      // TODO: Fetch data      
    }
  }
  
  /**
   * Updates the favorit count for a given key.
   */
  update(key) {
    this._favoritesDb.match(key).then((response) => {
      if (response) {
        this._favoritesDb.put(key, response.value + 1);
      } else {
        this._favoritesDb.put(key, 1);
      }
    });
  }
}