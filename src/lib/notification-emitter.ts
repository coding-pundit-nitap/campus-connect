import { EventEmitter } from "events";

import { redisSubscriber } from "./redis";

declare global {
  var notificationEmitter: NotificationEmitter | undefined;
}

class NotificationEmitter extends EventEmitter {
  private listenerCounts = new Map<string, number>();

  constructor() {
    super();
    // Increase max listeners to prevent warnings when many channels are subscribed
    // Each channel can have multiple listeners (one per client connection)
    this.setMaxListeners(0); // 0 means unlimited
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

    // Debug log
    const newCount = this.listenerCount(channel);
    console.log(
      `[NotificationEmitter] Added listener to "${channel}" | Tracked: ${currentCount + 1} | Actual: ${newCount}`
    );
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

    // Debug log
    const newCount = this.listenerCount(channel);
    console.log(
      `[NotificationEmitter] Removed listener from "${channel}" | Tracked: ${Math.max(0, currentCount - 1)} | Actual: ${newCount}`
    );
  }

  /**
   * Debug method to inspect all current listeners
   * Call this in your route or whenever you want to check listener status
   */
  debugListeners() {
    const eventNames = this.eventNames();
    console.log("\n" + "=".repeat(80));
    console.log("📊 [NOTIFICATION EMITTER - LISTENER DEBUG INFO]");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Total unique channels with listeners: ${eventNames.length}`
    );

    // Show actual listeners from EventEmitter
    let totalListeners = 0;
    eventNames.forEach((eventName) => {
      const eventNameStr = String(eventName);
      const count = this.listenerCount(eventNameStr);
      totalListeners += count;
      console.log(`  📌 Channel: "${eventNameStr}"`);
      console.log(`     Listeners: ${count}`);

      // Show listener details
      const listeners = this.listeners(eventNameStr);
      listeners.forEach((listener, index) => {
        console.log(
          `       [${index + 1}] ${listener.name || "anonymous function"}`
        );
      });
    });

    console.log(`\n📈 Total listeners across all channels: ${totalListeners}`);

    // Show tracked counts in Map
    console.log(`\n📋 Tracked in listenerCounts Map:`);
    if (this.listenerCounts.size === 0) {
      console.log("  (empty)");
    } else {
      this.listenerCounts.forEach((count, channel) => {
        console.log(`  "${channel}" -> ${count}`);
      });
    }

    // Check for discrepancies
    console.log(`\n🔍 Validation:`);
    let discrepancies = 0;
    this.listenerCounts.forEach((count, channel) => {
      const actualCount = this.listenerCount(channel);
      if (count !== actualCount) {
        console.log(
          `  ⚠️  MISMATCH on "${channel}": Map says ${count}, but actual is ${actualCount}`
        );
        discrepancies++;
      }
    });

    if (discrepancies === 0) {
      console.log("  ✅ No discrepancies found");
    }

    console.log("=".repeat(80) + "\n");
  }

  /**
   * Get a summary of listeners without logging
   */
  getListenerStats() {
    const eventNames = this.eventNames();
    let totalListeners = 0;

    eventNames.forEach((eventName) => {
      totalListeners += this.listenerCount(eventName as string);
    });

    return {
      channelsWithListeners: eventNames.length,
      totalListeners,
      channels: Array.from(this.listenerCounts.entries()),
    };
  }
}

const notificationEmitter =
  global.notificationEmitter || new NotificationEmitter();

if (process.env.NODE_ENV !== "production") {
  global.notificationEmitter = notificationEmitter;
}

export default notificationEmitter;
