import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { PhotoEntity } from './entities/photo.entity';
import { PhotoProcessor } from './photo.processor';
import { PhotoQueueService } from './photo-queue.service';
import { WorkerPoolManager } from './worker-pool.manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotoEntity]),
    BullModule.registerQueue({
      name: 'photo-processing',
      defaultJobOptions: {
        attempts: 3, // Количество попыток
      },
    }),
  ],
  controllers: [PhotoController],
  providers: [
    PhotoService,
    PhotoQueueService,
    PhotoProcessor,
    WorkerPoolManager,
  ],
})
export class PhotoModule {}
