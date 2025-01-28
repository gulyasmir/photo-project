import { Test, TestingModule } from '@nestjs/testing';
import { PhotoProcessor } from './photo.processor';
import { PhotoService } from './photo.service';
import { Job, QueueEvents } from 'bullmq';

jest.mock('bullmq', () => {
  const original = jest.requireActual('bullmq');
  return {
    ...original,
    QueueEvents: jest.fn(() => ({
      on: jest.fn(),
    })),
  };
});

describe('PhotoProcessor', () => {
  let photoProcessor: PhotoProcessor;
  let photoService: jest.Mocked<PhotoService>;

  beforeEach(async () => {
    photoService = {
      generatePreview: jest.fn(),
      extractExifAndSave: jest.fn(),
    } as unknown as jest.Mocked<PhotoService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoProcessor,
        { provide: PhotoService, useValue: photoService },
      ],
    }).compile();

    photoProcessor = module.get<PhotoProcessor>(PhotoProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should call generatePreview for task generate-preview', async () => {
      const job: Job<any> = {
        data: { filename: 'test.jpg', task: 'generate-preview' },
      } as Job<any>;

      await photoProcessor.process(job);

      expect(photoService.generatePreview).toHaveBeenCalledWith('test.jpg');
    });

    it('should call extractExifAndSave for task extract-exif', async () => {
      const job: Job<any> = {
        data: { filename: 'test.jpg', task: 'extract-exif' },
      } as Job<any>;

      await photoProcessor.process(job);

      expect(photoService.extractExifAndSave).toHaveBeenCalledWith('test.jpg');
    });

    it('should not call any service method for an unknown task', async () => {
      const job: Job<any> = {
        data: { filename: 'test.jpg', task: 'unknown-task' },
      } as Job<any>;

      await photoProcessor.process(job);

      expect(photoService.generatePreview).not.toHaveBeenCalled();
      expect(photoService.extractExifAndSave).not.toHaveBeenCalled();
    });
  });
});
