import { useQuery } from '@tanstack/react-query';
import { editionsApi } from '@/api';

interface TrainingBannerProps {
  editionId: string;
}

export function TrainingBanner({ editionId }: TrainingBannerProps) {
  const { data: edition } = useQuery({
    queryKey: ['edition', editionId],
    queryFn: () => editionsApi.getEdition(editionId),
    enabled: !!editionId,
  });

  if (!edition?.isTraining) return null;

  return (
    <div className="bg-amber-100 border border-amber-400 text-amber-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      Bourse de formation — Les donn\u00e9es de cette \u00e9dition sont destin\u00e9es \u00e0 l'entra\u00eenement uniquement.
    </div>
  );
}
