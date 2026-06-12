import { EventEmitter } from "events";

import { createLogger } from "@/lib/logger";

import { redisSubscriber } from "./redis";
const log = createLogger("notification-emitter");

declare global {
  var notificationEmitter: NotificationEmitter | undefined;
}

class NotificationEmitter extends EventEmitter {
  private listenerCounts = new Map<string, number>();

  constructor() {
    super();
    this.setMaxListeners(0);
    redisSubscriber.on("message", (channel, message) => {
      this.emit(channel, message);
    });
  }

  subscribe(channel: string, handler: (message: string) => void) {
    const currentCount = this.listenerCounts.get(channel) || 0;

    if (currentCount === 0) {
      redisSubscriber.subscribe(channel, (error) => {
        if (error) {
          log.error(
            { err: error },
            `[Redis] Failed to subscribe to ${channel}`
          );
        } else {
          log.debug(`[Redis] Subscribed to channel: ${channel}`);
        }
      });
    }

    this.listenerCounts.set(channel, currentCount + 1);
    this.on(channel, handler);
  }

  unsubscribe(channel: string, handler: (message: string) => void) {
    this.removeListener(channel, handler);
    const currentCount = this.listenerCounts.get(channel) ?? 0;
    const newCount = Math.max(0, currentCount - 1);
    if (newCount === 0) {
      redisSubscriber.unsubscribe(channel, (err) => {
        if (err) {
          log.error(
            { err: err },
            `[Redis] Failed to unsubscribe from ${channel}`
          );
        } else {
          log.debug(`[Redis] Unsubscribed from channel: ${channel}`);
        }
      });
      this.listenerCounts.delete(channel);
    } else {
      this.listenerCounts.set(channel, newCount);
    }
  }
}

const notificationEmitter =
  global.notificationEmitter ?? new NotificationEmitter();

global.notificationEmitter = notificationEmitter;

export default notificationEmitter;
