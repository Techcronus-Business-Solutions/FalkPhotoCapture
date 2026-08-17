import { storage } from './storage';
import type { PhotoItem } from '../store/photoStore';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Extracts the trailing _N sequence number from a BOL-based filename.
// Returns null if the filename does not match the {BOL}_{N}.ext pattern.
export const extractBolSequence = (bol: string, fileName: string): number | null => {
  const regex = new RegExp(`^${escapeRegex(bol)}_(\\d+)\\.[^.]+$`);
  const match = fileName.match(regex);
  return match ? parseInt(match[1], 10) : null;
};

const getStoredCounter = async (bol: string): Promise<number> => {
  const counters = await storage.getItem<Record<string, number>>(
    storage.KEYS.BOL_SEQUENCES,
  );
  return counters?.[bol] ?? 0;
};

const saveStoredCounter = async (bol: string, seq: number): Promise<void> => {
  const counters =
    (await storage.getItem<Record<string, number>>(
      storage.KEYS.BOL_SEQUENCES,
    )) ?? {};
  counters[bol] = seq;
  await storage.setItem(storage.KEYS.BOL_SEQUENCES, counters);
};

const computeMaxSequence = (
  bol: string,
  fileNames: string[],
  floor: number,
): number =>
  fileNames.reduce((max, name) => {
    const seq = extractBolSequence(bol, name);
    return seq !== null && seq > max ? seq : max;
  }, floor);

/**
 * Assigns sequential BOL-based filenames to an array of new photos.
 *
 * The next sequence number is derived from:
 *   - The highest sequence found in existingFileNames (server + pending + session)
 *   - The stored counter for this BOL, BUT only when existingFileNames already
 *     contains at least one BOL-matching filename. If the server wiped all images
 *     and there are no pending/session files, the stored counter is stale and we
 *     reset to 0 so the sequence restarts from _1.
 *
 * Returns the renamed PhotoItems and a `persist()` function the caller MUST
 * await after the photos are safely stored, to commit the new counter.
 */
export const assignBolFileNames = async (
  bol: string,
  photos: PhotoItem[],
  existingFileNames: string[],
): Promise<{ renamedPhotos: PhotoItem[]; persist: () => Promise<void> }> => {
  const maxFromExisting = computeMaxSequence(bol, existingFileNames, 0);

  // If no BOL-matching filename exists anywhere, the server wiped the images.
  // Ignore the stale stored counter and restart from 0 so the next file is _1.
  const storedCounter = maxFromExisting > 0 ? await getStoredCounter(bol) : 0;
  let max = Math.max(storedCounter, maxFromExisting);

  const renamedPhotos = photos.map(photo => {
    max += 1;
    const ext = photo.fileName?.match(/(\.[^.]+)$/)?.[1] ?? '.png';
    return { ...photo, fileName: `${bol}_${max}${ext}` };
  });

  const finalMax = max;
  return {
    renamedPhotos,
    persist: () => saveStoredCounter(bol, finalMax),
  };
};
