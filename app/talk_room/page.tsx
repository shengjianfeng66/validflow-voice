import { headers } from 'next/headers';
import { TalkRoomApp } from '@/components/app/talk-room-app';
import { getAppConfig } from '@/lib/utils';

export default async function TalkRoomPage() {
  const headersList = await headers();
  const appConfig = await getAppConfig(headersList);

  return <TalkRoomApp appConfig={appConfig} />;
}
