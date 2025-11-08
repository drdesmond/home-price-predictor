/* eslint-disable @typescript-eslint/unbound-method */
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PredictionController } from './prediction.controller';
import { Prediction } from './prediction.entity';
import { PredictionService } from './prediction.service';

describe('PredictionController', () => {
  let controller: PredictionController;
  let predictionService: jest.Mocked<PredictionService>;

  beforeEach(async () => {
    predictionService = {
      predictAndStore: jest.fn(),
      persistPrediction: jest.fn(),
      findAll: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
    } as unknown as jest.Mocked<PredictionService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PredictionController],
      providers: [
        {
          provide: PredictionService,
          useValue: predictionService,
        },
      ],
    }).compile();

    controller = module.get<PredictionController>(PredictionController);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    const dto = { square_footage: 1200, bedrooms: 3 };
    const persistedPrediction: Prediction = {
      id: 1,
      ...dto,
      predicted_price: 350000,
      created_at: new Date('2024-01-01T00:00:00.000Z'),
    };

    it('delegates prediction and persistence to the service', async () => {
      predictionService.predictAndStore.mockResolvedValue(persistedPrediction);

      const prediction = await controller.create(dto);

      expect(predictionService.predictAndStore).toHaveBeenCalledWith(dto);
      expect(prediction).toEqual({
        id: persistedPrediction.id,
        square_footage: persistedPrediction.square_footage,
        bedrooms: persistedPrediction.bedrooms,
        predicted_price: persistedPrediction.predicted_price,
        created_at: persistedPrediction.created_at,
      });
    });

    it('rethrows HttpException from service', async () => {
      predictionService.predictAndStore.mockRejectedValue(
        new HttpException('bad request', HttpStatus.BAD_GATEWAY),
      );

      await expect(controller.create(dto)).rejects.toMatchObject({
        status: HttpStatus.BAD_GATEWAY,
      });
    });

    it('wraps unexpected errors from service', async () => {
      predictionService.predictAndStore.mockRejectedValue(
        new Error('Database unavailable'),
      );

      await expect(controller.create(dto)).rejects.toBeInstanceOf(
        HttpException,
      );
    });
  });

  describe('findAll', () => {
    it('returns predictions with count', async () => {
      const predictions: Prediction[] = [
        {
          id: 1,
          square_footage: 1200,
          bedrooms: 3,
          predicted_price: 300000,
          created_at: new Date('2024-01-01T00:00:00.000Z'),
        },
      ];

      predictionService.findAll.mockResolvedValue(predictions);
      predictionService.count.mockResolvedValue(predictions.length);

      const response = await controller.findAll({});

      expect(predictionService.findAll).toHaveBeenCalledWith(100);
      expect(predictionService.count).toHaveBeenCalled();
      expect(response).toEqual({
        count: predictions.length,
        predictions: predictions.map((prediction) => ({
          id: prediction.id,
          square_footage: prediction.square_footage,
          bedrooms: prediction.bedrooms,
          predicted_price: prediction.predicted_price,
          created_at: prediction.created_at,
        })),
      });
    });

    it('honours limit override', async () => {
      predictionService.findAll.mockResolvedValue([]);
      predictionService.count.mockResolvedValue(0);

      await controller.findAll({ limit: 10 });

      expect(predictionService.findAll).toHaveBeenCalledWith(10);
    });
  });
});
