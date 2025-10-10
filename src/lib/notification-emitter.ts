import { EventEmitter } from "events";

import { redisSubscriber } from "./redis";

declare global {
  var notificationEmitter: NotificationEmitter | undefined;
}

class NotificationEmitter extends EventEmitter {
  private listenerCounts = new Map<string, number>();

  constructor() {
    super();
    redisSubscriber.on("message", (channel, message) => {
      this.emit(channel, message);
    });
  }

  subscribe(channel: string, handler: (message: string) => void) {
    const currentCount = this.listenerCounts.get(channel) || 0;

    if (currentCount === 0) {
      redisSubscriber.subscribe(channel, (error) => {
        if (error) {
          console.error(`[Redis] Failed to subscribe to ${channel}`, error);
        } else {
          console.log(`[Redis] Subscribed to channel: ${channel}`);
        }
      });
    }

    this.listenerCounts.set(channel, currentCount + 1);
    this.on(channel, handler);
  }

  unsubscribe(channel: string, handler: (message: string) => void) {
    this.removeListener(channel, handler);
    const currentCount = this.listenerCounts.get(channel) || 1;
    if (currentCount <= 1) {
      redisSubscriber.unsubscribe(channel, (err) => {
        if (err) {
          console.error(`[Redis] Failed to unsubscribe from ${channel}`, err);
        } else {
          console.log(`[Redis] Unsubscribed from channel: ${channel}`);
        }
      });
      this.listenerCounts.delete(channel);
    } else {
      this.listenerCounts.set(channel, currentCount - 1);
    }
  }
}

const notificationEmitter =
  global.notificationEmitter || new NotificationEmitter();

if (process.env.NODE_ENV !== "production") {
  global.notificationEmitter = notificationEmitter;
}

export default notificationEmitter;
