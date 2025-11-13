import { Queue } from 'bullmq'
import bullmqConfig from '#config/bullmq'

export default class QueueService {
  private queues: Map<string, Queue> = new Map()

  getQueue(name: string = 'mythicstats-jobs'): Queue {
    if (!this.queues.has(name)) {
      const config = (bullmqConfig as any).queues?.[name]
      const queue = new Queue(name, {
        connection: (bullmqConfig as any).connection,
        defaultJobOptions: config?.defaultJobOptions,
      })
      this.queues.set(name, queue)
    }
    return this.queues.get(name)!
  }

  async close(): Promise<void> {
    for (const queue of this.queues.values()) {
      await queue.close()
    }
    this.queues.clear()
  }
}
