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
    const job =  await this.queue.add('process-photo', { filename, task }, { removeOnComplete: false, removeOnFail: false  });
  }

  private async monitorQueue() {
    setInterval(async () => {
      const waitingCount = await this.queue.getWaitingCount();

      if (waitingCount > 50) {
        this.workerPoolManager.scaleWorkers(5); // Увеличиваем до максимума
      } else if (waitingCount > 20) {
        this.workerPoolManager.scaleWorkers(3); // Средняя нагрузка
      } else {
        this.workerPoolManager.scaleWorkers(2); // Низкая нагрузка
      }
    }, 5000); // Проверяем очередь каждые 5 секунд
  }
}
