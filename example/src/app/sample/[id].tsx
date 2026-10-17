import { sampleById } from '@react-jsonschema-ui/samples';
import { Stack, useLocalSearchParams } from 'expo-router';

import { NotFound, SampleScreen } from '@/screens/sample';

export default function SampleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sample = sampleById.get(id);
  return (
    <>
      <Stack.Screen options={{ title: sample?.title ?? 'Not found' }} />
      {sample ? <SampleScreen sample={sample} /> : <NotFound id={id} />}
    </>
  );
}
