import { Test, TestingModule } from '@nestjs/testing';
import { PhotoService } from './photo.service';
import { PhotoQueueService } from './photo-queue.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PhotoEntity } from './entities/photo.entity';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';
module.exports = class ImageProcessingAdapter {
  async processImageWithDefaultConfiguration(buffer, size, options) {
    return await sharp(buffer).resize(size).jpeg(options).toBuffer();
  }
};

jest.mock('sharp', () => {
  const sharpInstance = {
    resize: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('preview content')),
  };

  const sharpMock = jest.fn(() => sharpInstance);

  return sharpMock; // Возвращаем саму мокированную функцию
});

describe('PhotoService', () => {
  let service: PhotoService;
  let mockPhotoQueueService: jest.Mocked<PhotoQueueService>;
  let mockPhotoRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockPhotoQueueService = {
      addTask: jest.fn(),
    } as unknown as jest.Mocked<PhotoQueueService>;

    mockPhotoRepo = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotoService,
        { provide: PhotoQueueService, useValue: mockPhotoQueueService },
        { provide: getRepositoryToken(PhotoEntity), useValue: mockPhotoRepo },
      ],
    }).compile();

    service = module.get<PhotoService>(PhotoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePreview', () => {
    it('should generate a preview of the image', async () => {
      jest.spyOn(fs, 'readFile').mockResolvedValue(Buffer.from('test content'));
      jest.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

      const filename = 'test.jpg';
      await service.generatePreview(filename);

      const sharpMock = sharp as unknown as jest.Mock;
      expect(sharpMock).toHaveBeenCalledWith(Buffer.from('test content'));

      const sharpInstance = sharpMock.mock.results[0].value;
      expect(sharpInstance.resize).toHaveBeenCalledWith(200, 200);
      expect(sharpInstance.toBuffer).toHaveBeenCalled();

      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(process.cwd(), './uploads/previews'),
        { recursive: true },
      );
    });
  });
});
