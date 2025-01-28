import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PhotoService } from './photo.service';

@Processor('photo-processing')
export class PhotoProcessor extends WorkerHost {
  constructor(
    private readonly photoService: PhotoService
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
