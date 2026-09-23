import { useEffect, useState } from 'react';
import { bendexService } from '../services/bendexService';
import type { BoxDetailItem } from '../navigation/types';

const useBendexBoxList = (orderNumber: string) => {
  const [boxes, setBoxes] = useState<BoxDetailItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const boxTrimCounts =
          await bendexService.fetchBendexAssignments(orderNumber);
        if (!cancelled) {
          setBoxes(
            boxTrimCounts
              .filter(box => box.uniqueTrimCount > 0)
              .map(box => ({
                boxNumber: box.boxNumber,
                boxName: `Box ${box.boxNumber}`,
                itemCount: box.uniqueTrimCount,
              })),
          );
        }
      } catch {
        if (!cancelled) {
          setBoxes([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  return { boxes, loading };
};

export default useBendexBoxList;
