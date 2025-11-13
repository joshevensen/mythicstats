import { Worker } from 'bullmq'
import bullmqConfig from '#config/bullmq'
import { ProcessorFactory } from '#jobs/processors/factory'
import User from '#models/user'
import type { Job } from 'bullmq'

const worker = new Worker(
  'mythicstats-jobs',
  async (job: Job) => {
    const user = await User.findOrFail(job.data.userId)
    const processor = ProcessorFactory.create(job.name, user)
    await processor.process(job)
  },
  {
    connection: (bullmqConfig as any).connection,
    concurrency: 1,
  }
)

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err)
})

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})
