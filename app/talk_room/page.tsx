import { headers } from 'next/headers';
import { getAppConfig } from '@/lib/utils';
import { TalkRoomApp } from '@/components/app/talk-room-app';

export default async function TalkRoomPage() {
  const headersList = await headers();
  const appConfig = await getAppConfig(headersList);

  return <TalkRoomApp appConfig={appConfig} />;
}