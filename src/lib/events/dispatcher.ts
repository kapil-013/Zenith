import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { AppEvent, AppNotification, Issue, User } from "../../types";

type EventSubscriber = (event: AppEvent) => Promise<void>;

class EventDispatcher {
  private subscribers: Map<string, EventSubscriber[]> = new Map();

  subscribe(eventType: string, subscriber: EventSubscriber) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)!.push(subscriber);
  }

  async dispatch(event: Omit<AppEvent, "timestamp">) {
    const fullEvent: AppEvent = {
      ...event,
      timestamp: Date.now(),
    };

    console.log(`[Event Dispatched] ${fullEvent.type}`, fullEvent);

    // Run subscribers asynchronously
    const eventSubscribers = this.subscribers.get(fullEvent.type) || [];
    const wildcardSubscribers = this.subscribers.get("*") || [];

    const allSubscribers = [...eventSubscribers, ...wildcardSubscribers];

    // We don't await them directly to avoid blocking the UI
    Promise.allSettled(allSubscribers.map((sub) => sub(fullEvent))).catch(
      (err) => console.error(`Error processing event ${fullEvent.type}`, err)
    );
  }
}

export const dispatcher = new EventDispatcher();
