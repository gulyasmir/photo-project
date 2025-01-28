import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { WorkerPoolManager } from './worker-pool.manager';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class PhotoQueueService implements OnModuleInit {
  constructor(
    private readonly workerPoolManager: WorkerPoolManager,
    @InjectQueue('photo-processing') private readonly queue: Queue,
  ) {}

  onModuleInit() {
    this.monitorQueue();
  }

  async addTask(filename: string, task: string) {
    console.log('Adding task to queue:', {
      queueName: 'photo-processing',
      taskName: task,
      data: { filename, task },
    });
    await this.queue.add('process-photo', { filename, task });
  }

  private async monitorQueue() {
    setInterval(async () => {
      const waitingCount = await this.queue.getWaitingCount();

      if (waitingCount > 50) {
        this.workerPoolManager.scaleWorkers(5); // Увеличиваем до максимума
      } else if (waitingCount > 20) {
        this.workerPoolManager.scaleWorkers(3); // Средняя нагрузка
      } else {
        this.workerPoolManager.scaleWorkers(1); // Низкая нагрузка
      }
    }, 5000); // Проверяем очередь каждые 5 секунд
  }
}
