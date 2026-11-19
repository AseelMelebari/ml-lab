import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { LAB_COMPONENTS } from '@/labs/registry';
import { Spinner } from '@/components/ui/primitives';

export default function LabPage() {
  const { id = '' } = useParams();
  const Lab = LAB_COMPONENTS[id];
  if (!Lab) return <div className="p-10">Unknown lab</div>;
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
      <Suspense fallback={<Spinner />}>
        <Lab />
      </Suspense>
    </div>
  );
}
