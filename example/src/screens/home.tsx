import { type Sample, samples } from '@react-jsonschema-ui/samples';
import { Link } from 'expo-router';
import { FlatList, Pressable } from 'react-native';
import { Paragraph, SizableText, XStack, YStack } from 'tamagui';

export function Home() {
  return (
    <FlatList
      data={samples}
      keyExtractor={(sample) => sample.id}
      contentInsetAdjustmentBehavior="automatic"
      ListHeaderComponent={<Intro />}
      renderItem={({ item }) => <SampleRow sample={item} />}
      ItemSeparatorComponent={Separator}
    />
  );
}

function Intro() {
  return (
    <YStack paddingHorizontal="$4" paddingTop="$3" paddingBottom="$4">
      <Paragraph size="$3" color="$color10">
        JSON Schema forms rendered with Tamagui. The same samples power the web playground.
      </Paragraph>
    </YStack>
  );
}

function SampleRow({ sample }: { sample: Sample }) {
  return (
    <Link href={{ pathname: '/sample/[id]', params: { id: sample.id } }} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={sample.title}>
        {({ pressed }) => (
          <XStack
            paddingHorizontal="$4"
            paddingVertical="$3"
            gap="$3"
            alignItems="center"
            backgroundColor={pressed ? '$backgroundPress' : '$background'}
          >
            <YStack flex={1} gap="$1">
              <SizableText size="$5" fontWeight="600">
                {sample.title}
              </SizableText>
              <Paragraph size="$2" color="$color10" numberOfLines={2}>
                {sample.description}
              </Paragraph>
            </YStack>
            <SizableText size="$6" color="$color8">
              ›
            </SizableText>
          </XStack>
        )}
      </Pressable>
    </Link>
  );
}

function Separator() {
  return <YStack height={1} marginLeft="$4" backgroundColor="$borderColor" />;
}
