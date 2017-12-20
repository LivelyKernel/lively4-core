import { Dictionary } from './dictionary.js';
import {
  getBootFiles,
  mergeArrays
} from './util.js';
import focalStorage from '../../focalStorage.js';

/**
 * Tracks most frequently(recently?) used files.
 * Currently uses IndexedDB to store data
 */
export class FavoritesTracker {
  
  /**
   * @param cache The cache to store the favorites in. Has to provide a 'preloadFile' method.
   */
  constructor(cache) {
    // Wait 5 minutes before refreshing the favorites
    FavoritesTracker._minRefreshTime = 5 * 60 * 1000;
    this._responseDb = new Dictionary('response-cache');
    this._favoritesDb = new Dictionary('favorites');
    this._favoritesDb.onconnect = this._checkFavorites.bind(this);
    this._cache = cache;
  }
  
  /**
   * Load favorites by descending popularity
   */
  async _checkFavorites() {
    console.error("Count favorit");
    // Check if favorites should be loaded
    if (this._cache.getCacheMode() != 2) return;
    
    console.error("Count favorit");
    
    this.favorites = await this._favoritesDb.toArray();
    
    // Sort favorites by descending popularity
    this.favorites.sort(function(first, second) {
      return second[1].value - first[1].value;
    });
    
    const favoriteFiles = this.favorites.map(e => e[0]);
    const filesToLoad = mergeArrays(await getBootFiles(), favoriteFiles);
    
    for (let file of filesToLoad) {
      // TODO: We can probably just check the cache here instead of directly asking the DB
      let entry = await this._responseDb.match("GET " + file);
      
      // Check if entry is old enough
      // console.log(`Checking ${file}`);
      if (entry != null && Date.now() - entry.timestamp < FavoritesTracker._minRefreshTime) continue;
      
      // Fetch data
      // console.log(`Preloading ${file}`);
      this._cache.preloadFile(file);
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