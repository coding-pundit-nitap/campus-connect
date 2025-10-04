import { EventEmitter } from "events";

import { redisSubscriber } from "./redis";

class NotificationEmitter extends EventEmitter {}

const notificationEmitter = new NotificationEmitter();
let isRedisListenerAttached = false;

const subscribedChannels = new Set<string>();

if (!isRedisListenerAttached) {
  redisSubscriber.on("message", (channel, message) => {
    notificationEmitter.emit(channel, message);
  });
  isRedisListenerAttached = true;
}

export const subscribeToChannel = (channel: string) => {
  if (!subscribedChannels.has(channel)) {
    redisSubscriber.subscribe(channel, (err) => {
      if (err) {
        console.error(`[Redis] Failed to subscribe to ${channel}`, err);
        return;
      }
      subscribedChannels.add(channel);
      console.log(`[Redis] Subscribed to channel: ${channel}`);
    });
  }
};

export default notificationEmitter;
