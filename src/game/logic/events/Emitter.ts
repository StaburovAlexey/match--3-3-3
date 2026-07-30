type EventHandler<Payload> = (payload: Payload) => void

export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<EventHandler<unknown>>>()

  on<EventName extends keyof Events>(
    eventName: EventName,
    handler: EventHandler<Events[EventName]>,
  ): () => void {
    let eventListeners = this.listeners.get(eventName)

    if (!eventListeners) {
      eventListeners = new Set()
      this.listeners.set(eventName, eventListeners)
    }

    eventListeners.add(handler as EventHandler<unknown>)

    return () => {
      this.off(eventName, handler)
    }
  }

  off<EventName extends keyof Events>(
    eventName: EventName,
    handler: EventHandler<Events[EventName]>,
  ): void {
    const eventListeners = this.listeners.get(eventName)

    if (!eventListeners) {
      return
    }

    eventListeners.delete(handler as EventHandler<unknown>)

    if (eventListeners.size === 0) {
      this.listeners.delete(eventName)
    }
  }

  emit<EventName extends keyof Events>(eventName: EventName, payload: Events[EventName]): void {
    const eventListeners = this.listeners.get(eventName)

    if (!eventListeners) {
      return
    }

    for (const handler of eventListeners) {
      handler(payload)
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}
