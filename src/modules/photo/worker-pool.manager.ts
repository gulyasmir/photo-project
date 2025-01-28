import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WorkerPoolManager implements OnModuleInit, OnModuleDestroy {
  private workers: Worker[] = [];
  private readonly maxWorkers = 5; // Максимальное количество воркеров
  private readonly queueName = 'photo-processing';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.scaleWorkers(2); // Инициализируем с 2 воркерами
  }

  onModuleDestroy() {
    this.stopAllWorkers();
  }

  scaleWorkers(count: number) {
    const currentCount = this.workers.length;

    if (count > currentCount) {
      this.addWorkers(count - currentCount);
    } else if (count < currentCount) {
      this.removeWorkers(currentCount - count);
    }
  }

  private addWorkers(count: number) {
    for (let i = 0; i < count; i++) {
      const worker = new Worker(
        this.queueName,
        async (job) => {
          console.log(`Worker processing job: ${job.id}`);
          // Обработка задачи происходит в PhotoProcessor
        },
        {
          connection: {
            host: this.configService.get<string>('redis.host'),
            port: this.configService.get<number>('redis.port'),
            db: this.configService.get<number>('redis.db'),
          },
        },
      );
      worker.on('completed', (job) => {
        console.log(`Job completed: ${job.id}`);
      });
      worker.on('failed', (job, err) => {
        console.error(`Job failed: ${job.id}`, err);
      });

      this.workers.push(worker);
    }
  }

  private removeWorkers(count: number) {
    for (let i = 0; i < count; i++) {
      const worker = this.workers.pop();
      if (worker) {
        worker.close(); // Закрываем воркер
      }
    }
  }

  private stopAllWorkers() {
    this.workers.forEach((worker) => worker.close());
    this.workers = [];
  }
}
