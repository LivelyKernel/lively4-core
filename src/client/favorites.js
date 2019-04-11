import focalStorage from "src/external/focalStorage.js"

const MAIN_DIRECTORY = lively4url + '/';
const MATCH_MAIN_DIRECTORY = new RegExp('^' + MAIN_DIRECTORY, 'i');
const STORAGE_KEY = 'favorite-files';

function toFullURL(url) {
  return new URL(url, MAIN_DIRECTORY).toString();
}

function removeMainDirectory(fullURL) {
  return fullURL.replace(MATCH_MAIN_DIRECTORY, '');
}

export default class Favorites {
  static async get() {
    const urls = await focalStorage.getItem(STORAGE_KEY) || [];
    const fullURLs = urls.map(toFullURL);
    return fullURLs;
  }

  static async set(fullURLs) {
    const relativeURLs = fullURLs.map(removeMainDirectory);
    return focalStorage.setItem(STORAGE_KEY, relativeURLs);
  }
  
  static async has(fullURL) {
    return (await this.get()).includes(fullURL);
  }

  static async add(newFullURL) {
    const fullURLs = new Set(await this.get());
    fullURLs.add(newFullURL)
    return this.set(Array.from(fullURLs));
  }

  static async remove(fullURL) {
    const fullURLs = new Set(await this.get());
    fullURLs.delete(fullURL)
    return this.set(Array.from(fullURLs));
  }
  
  static async toggle(fullURL) {
    if(await this.has(fullURL)) {
      await this.remove(fullURL);
    } else {
      await this.add(fullURL);
    }
  }
}
