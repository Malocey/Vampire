const DB_NAME = 'audioCache';
const STORE_NAME = 'audioFiles';

let db: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, 1);

        request.onerror = () => reject(new Error('Error opening IndexedDB'));
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        request.onupgradeneeded = () => {
            const store = request.result.createObjectStore(STORE_NAME);
        };
    });
};

export const getCachedAudio = async (url: string): Promise<Blob | null> => {
    const db = await openDB();
    return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
    });
};

export const cacheAudio = async (url: string, blob: Blob): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(blob, url);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Error caching audio'));
    });
};