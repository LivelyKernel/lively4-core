# lively4-search
Index based client and server side search for Lively4


## Index Manager Component

lively4 contains an Index Manager Component, which allows managing lunr-indexes. Lunr is currently used for Dropbox and Server search. The Index Manager can be open using the `Settings` button in the search widget (`Ctrl+Shift+F`).
For every indexable folder on the Server and every mounted Dropbox you have a current index status and buttons to refresh the status, create an index, and remove an index.
Status can be one of the following:
- unavailabe: there is no index file available in this location
- available: there is an index available, but is is not loaded yet (clicking the `plus`-button will load it)
- indexing: indexing is currently running 
- ready: index is loaded and this location will be available for search
- *unknown*: not an actual status, this appears when something weird happend, usually due to Service Worker issues (try re-opening the Index Manager)

When opening the Index Manager, it will automatically check the status of all locations. If an index is available, it will load it.


## Indexing the Server

Lets say you have a location on the server with the status `unavailable`. Click the `plus`-button to create an index in this location. A spinner will appear. When you refresh the status, it will tell you that it's indexing. Once the indexing process is completed, the status will change to `ready`. Now this location will be included in your search results.
Internally this started a worker process on the server responsible for searching your queries. It will be available for everyone else accessing lively through the same server. Also this means that it will be automatically available the next time you come back.
The server index will be updated when files are written on the server. However it does not notice when files are changed using the `Sync-Tool`. Therefore, after pulling changes you have to delete the index (using the `delete`-button) and create it again.

## Indexing Dropboxes

Lets say you have a Dropbox mount with the status `unavailable`. Click the `plus`-button to create an index in this mount. A spinner will appear. When you refresh the status, it will tell you that it's indexing. **Right now there are some issues with the automatic status update of Dropbox mounts. Therefore, just click the `refresh`-button from time to time until it says ready. You can also check the console to see that indexing is still in progress.** Once the status is `ready`, this mount will be included in your search results. 
Internally this started a WebWorker in your browser, which is responsible for searching your queries (see parallels to Server search).
Since the index file is saved directly in the dropbox folder, the next time you load a page with this folder mounted, the search will just load this index file and search will be available. 

### Limitations of Dropbox

- The Service Worker does not implement a `delete` for Dropbox files, so the delete button for Dropbox indexes will not actually delete the index.
- The cache implemented in the Service Worker is relatively naive right now and may cause some issues when you delete the index file directly from your Dropbox (it will still say that it's available and load the old version from the cache).
- Writes to Dropbox files will not be noticed and the index cannot be updated gradually. The only way to update it is to delete and recreate it. (*See next steps*)

## Next Steps

### Gradual updates of Dropbox index
A good start would be to use the [Dropbox long_poll API](https://www.dropbox.com/developers-v1/core/docs#longpoll-delta). The logic for loading the changed files should reside in `lunr-dropbox-content-provider.js`.
