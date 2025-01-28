import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { exiftool } from 'exiftool-vendored';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';
import { PhotoEntity } from './entities/photo.entity';
import { PhotoService } from './photo.service';

@Processor('photo-processing')
export class PhotoProcessor extends WorkerHost {
  constructor(
    @InjectRepository(PhotoEntity)
    private readonly photoService: PhotoService,
  ) {
    super();
  }

  async process(job: Job<any>): Promise<void> {
    const { filename, task } = job.data;

    if (task === 'generate-preview') {
      await this.photoService.generatePreview(filename);
    } else if (task === 'extract-exif') {
      await this.photoService.extractExifAndSave(filename);
    }
  }
}
