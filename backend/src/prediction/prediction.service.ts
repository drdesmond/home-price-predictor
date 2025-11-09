import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Repository } from 'typeorm';
import { Prediction } from './prediction.entity';
type OnnxTensor = {
  data: number[] | Float32Array | Float64Array;
};

type OnnxInferenceSession = {
  outputNames: ReadonlyArray<string>;
  run(feeds: Record<string, OnnxTensor>): Promise<Record<string, OnnxTensor>>;
};

type OnnxRuntimeModule = {
  InferenceSession: {
    create(pathOrBuffer: string | Uint8Array): Promise<OnnxInferenceSession>;
  };
  Tensor: new (
    type: string,
    data: Float32Array | number[],
    dims: number[],
  ) => OnnxTensor;
};

type PersistPredictionInput = Pick<
  Prediction,
  'square_footage' | 'bedrooms' | 'predicted_price'
>;

type PredictionRequestInput = {
  square_footage: number;
  bedrooms: number;
};

type FlaskPredictionResponse = {
  predicted_price: number;
};

type FetchResponse = Awaited<ReturnType<typeof fetch>>;

/**
 * If `MODEL_URL` is not provided, predictions fall back to the locally-trained ONNX model
 * stored in `src/models/house_price_model.onnx`. Provide MODEL_URL=http://127.0.0.1:5000 in the .env file to delegate to the Flask API.
 */
const MODEL_URL = process.env.MODEL_URL ?? '';
const PREDICTION_REQUEST_TIMEOUT_MS = 10_000;
const MODEL_PATH_ENV = process.env.MODEL_PATH;
const DEFAULT_MODEL_CANDIDATES = [
  join(__dirname, '..', 'models', 'house_price_model.onnx'),
  join(process.cwd(), 'src', 'models', 'house_price_model.onnx'),
  join(process.cwd(), 'models', 'house_price_model.onnx'),
];

function resolveLocalModelPath(): string {
  if (MODEL_PATH_ENV) {
    const resolved = resolve(MODEL_PATH_ENV);
    if (!existsSync(resolved)) {
      throw new Error(
        `MODEL_PATH "${resolved}" does not exist. Please check your configuration.`,
      );
    }
    return resolved;
  }

  for (const candidate of DEFAULT_MODEL_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Unable to locate local ONNX model. Checked: ${DEFAULT_MODEL_CANDIDATES.join(
      ', ',
    )}`,
  );
}

type OnnxRuntimeState = {
  session: OnnxInferenceSession;
  Tensor: OnnxRuntimeModule['Tensor'];
};

/**
 * Handles external prediction requests and persistence of prediction entities.
 */
@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);
  private readonly localModelPath = resolveLocalModelPath();
  private onnxRuntime: OnnxRuntimeState | null = null;

  constructor(
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
  ) {}

  /**
   * Sends a prediction request to the Flask service and stores the persisted result.
   */
  async predictAndStore(input: PredictionRequestInput): Promise<Prediction> {
    try {
      let predictedPrice: number | null = null;

      let remoteError: unknown = null;

      if (MODEL_URL) {
        try {
          this.logger.log(`Using remote prediction service at ${MODEL_URL}.`);
          predictedPrice = await this.predictWithRemote(input);
        } catch (error: unknown) {
          if (error instanceof HttpException && error.getStatus() < 500) {
            throw error;
          }

          remoteError = error;
          this.logger.warn(
            `Remote prediction failed (${error instanceof Error ? error.message : String(error)}). Falling back to local ONNX model.`,
          );
        }
      }

      if (predictedPrice === null) {
        this.logger.log('Using locally stored ONNX model for prediction.');
        try {
          predictedPrice = await this.predictWithOnnx(input);
        } catch (fallbackError: unknown) {
          if (remoteError) {
            this.logger.error(
              'ONNX fallback failed after remote prediction error.',
              remoteError instanceof Error ? remoteError.stack : undefined,
            );
          }

          throw fallbackError;
        }
      }

      if (predictedPrice === null) {
        throw new HttpException(
          'Prediction could not be completed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return this.persistPrediction({
        ...input,
        predicted_price: predictedPrice,
      });
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error) {
        this.logger.error('Failed to predict and store result', error.stack);
        throw new HttpException(
          error.message ?? 'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      this.logger.error(
        'Failed to predict and store result due to unknown error',
      );
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Persists a prediction entity in the database.
   *
   * @param createPredictionInput - Prediction attributes to persist.
   * @returns Persisted prediction entity.
   */
  async persistPrediction(
    createPredictionInput: PersistPredictionInput,
  ): Promise<Prediction> {
    const prediction = this.predictionRepository.create(createPredictionInput);
    this.logger.log('Prediction to persist:', {
      bedrooms: createPredictionInput.bedrooms,
      square_footage: createPredictionInput.square_footage,
      predicted_price: createPredictionInput.predicted_price,
    });
    return this.predictionRepository.save(prediction);
  }

  private async predictWithRemote(
    input: PredictionRequestInput,
  ): Promise<number> {
    const response = await this.sendPredictionRequest(input);

    if (!response.ok) {
      const message = await this.extractErrorMessage(response);
      throw new HttpException(message, response.status);
    }

    const predictionData = await this.parsePredictionResponse(response);
    return predictionData.predicted_price;
  }

  /**
   * Returns recent predictions limited by the provided value.
   *
   * @param limit - Maximum number of predictions to fetch.
   * @returns Array of predictions ordered by creation date.
   */
  async findAll(limit: number): Promise<Prediction[]> {
    return this.predictionRepository.find({
      take: limit,
      order: {
        created_at: 'DESC',
      },
    });
  }

  /**
   * Retrieves the total number of predictions stored.
   *
   * @returns Total number of stored predictions.
   */
  async count(): Promise<number> {
    return this.predictionRepository.count();
  }

  /**
   * Finds a prediction by its identifier.
   *
   * @param id - Identifier of the prediction.
   * @returns Prediction if found, otherwise null.
   */
  async findOne(id: number): Promise<Prediction | null> {
    return this.predictionRepository.findOne({ where: { id } });
  }

  private async predictWithOnnx(
    input: PredictionRequestInput,
  ): Promise<number> {
    if (!this.onnxRuntime) {
      try {
        const ort = (await import('onnxruntime-node')) as OnnxRuntimeModule;
        const session = await ort.InferenceSession.create(this.localModelPath);
        this.onnxRuntime = { session, Tensor: ort.Tensor };
        this.logger.log(`Loaded ONNX model from ${this.localModelPath}`);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to load ONNX model';
        throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    const runtime = this.onnxRuntime;
    if (!runtime) {
      throw new HttpException(
        'ONNX runtime not available',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const tensorData = Float32Array.from([
        input.square_footage,
        input.bedrooms,
      ]);
      const inputTensor = new runtime.Tensor('float32', tensorData, [
        1,
        tensorData.length,
      ]);
      const feeds: Record<string, OnnxTensor> = { input: inputTensor };
      const results = await runtime.session.run(feeds);
      const outputTensor = results[runtime.session.outputNames[0]];

      if (!outputTensor?.data?.length) {
        throw new HttpException(
          'ONNX model returned empty result',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return Number(outputTensor.data[0]);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'ONNX prediction failed';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calls the Flask prediction endpoint with the given payload.
   */
  private async sendPredictionRequest(
    body: PredictionRequestInput,
  ): Promise<FetchResponse> {
    const flaskUrl = MODEL_URL;
    const endpoint = new URL('/predict', flaskUrl);
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PREDICTION_REQUEST_TIMEOUT_MS,
    );

    try {
      return await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new HttpException(
          'Prediction service timed out',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      if (error instanceof Error) {
        throw new HttpException(
          error.message ?? 'Prediction service error',
          HttpStatus.BAD_GATEWAY,
        );
      }

      throw new HttpException(
        'Prediction service error',
        HttpStatus.BAD_GATEWAY,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Extracts an error message from a non-successful fetch response.
   */
  private async extractErrorMessage(response: FetchResponse): Promise<string> {
    try {
      const payload = (await response.json()) as { error?: unknown };

      if (payload?.error && typeof payload.error === 'string') {
        return payload.error;
      }
    } catch (error: unknown) {
      this.logger.warn(
        `Unable to parse error response from prediction service: ${String(
          error,
        )}`,
      );
    }

    return 'Prediction request failed';
  }

  /**
   * Converts a successful fetch response into the expected prediction payload.
   */
  private async parsePredictionResponse(
    response: FetchResponse,
  ): Promise<FlaskPredictionResponse> {
    try {
      const payload =
        (await response.json()) as Partial<FlaskPredictionResponse>;

      if (
        payload?.predicted_price === undefined ||
        !Number.isFinite(Number(payload.predicted_price))
      ) {
        throw new HttpException(
          'Prediction service returned invalid payload',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return { predicted_price: Number(payload.predicted_price) };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        'Failed to parse prediction service response',
        error instanceof Error ? error.stack : undefined,
      );

      throw new HttpException(
        'Prediction service returned an unexpected response',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
