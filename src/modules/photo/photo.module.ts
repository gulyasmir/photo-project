import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PhotoService } from './photo.service';
import { PhotoController } from './photo.controller';
import { PhotoEntity } from './entities/photo.entity';
import { PhotoProcessor } from './photo.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([PhotoEntity]),
    BullModule.registerQueue({
      name: 'photo-processing',
    }),
  ],
  controllers: [PhotoController],
  providers: [PhotoService, PhotoProcessor],
})
export class PhotoModule {}
