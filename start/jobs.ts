import QueueService from '#services/queue_service'

export async function registerJobs(): Promise<void> {
  const queueService = new QueueService()
  const queue = queueService.getQueue('mythicstats-jobs')

  const User = await import('#models/user')
  const user = await User.default.first()
  if (!user) {
    throw new Error('No user found. Create a user first.')
  }

  // discover-sets weekly
  await queue.add(
    'discover-sets',
    { userId: user.id },
    {
      repeat: { pattern: '0 2 * * 1' },
      jobId: 'discover-sets-weekly',
      priority: 1,
    }
  )

  // sync-tracked-sets weekly
  await queue.add(
    'sync-tracked-sets',
    { userId: user.id },
    {
      repeat: { pattern: '0 3 * * 1' },
      jobId: 'sync-tracked-sets-weekly',
      priority: 2,
    }
  )

  // update-inventory-prices hourly at :15
  await queue.add(
    'update-inventory-prices',
    { userId: user.id },
    {
      repeat: { pattern: '15 * * * *' },
      jobId: 'update-inventory-prices-hourly',
      priority: 3,
    }
  )
}
