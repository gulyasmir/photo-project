import { Test, TestingModule } from '@nestjs/testing';
import { PhotoController } from './photo.controller';
import { PhotoService } from './photo.service';
import { BadRequestException } from '@nestjs/common';

// Mock PhotoService
const mockPhotoService = {
  savePhoto: jest.fn(),
};

describe('PhotoController', () => {
  let photoController: PhotoController;
  let photoService: PhotoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhotoController],
      providers: [
        {
          provide: PhotoService,
          useValue: mockPhotoService,
        },
      ],
    }).compile();

    photoController = module.get<PhotoController>(PhotoController);
    photoService = module.get<PhotoService>(PhotoService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadPhoto', () => {
    it('should throw BadRequestException if no file is provided', async () => {
      await expect(photoController.uploadPhoto(null)).rejects.toThrow(BadRequestException);
    });

    it('should call photoService.savePhoto with the file and return the result', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;
      const mockResult = 'Photo uploaded successfully';

      mockPhotoService.savePhoto.mockResolvedValue(mockResult);

      const response = await photoController.uploadPhoto(mockFile);

      expect(photoService.savePhoto).toHaveBeenCalledWith(mockFile);
      expect(response).toEqual({ message: mockResult });
    });

    it('should handle errors from photoService.savePhoto gracefully', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        buffer: Buffer.from('test data'),
      } as Express.Multer.File;

      mockPhotoService.savePhoto.mockRejectedValue(new Error('Database error'));

      await expect(photoController.uploadPhoto(mockFile)).rejects.toThrow('Database error');
    });
  });
});
