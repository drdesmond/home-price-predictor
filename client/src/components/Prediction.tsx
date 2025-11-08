import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Error from './Error';
import Result from './Result';
import type { PredictionResponse } from '../types/predictions';

const numberField = (fieldLabel: string) =>
    yup
        .number()
        .transform((value: unknown, originalValue: unknown) => {
            if (typeof originalValue === 'string') {
                const trimmed = originalValue.trim();
                if (trimmed.length === 0) {
                    return NaN;
                }
                const parsed = Number(trimmed);
                return Number.isNaN(parsed) ? NaN : parsed;
            }
            if (typeof value === 'number') {
                return Number.isNaN(value) ? NaN : value;
            }
            if (typeof value === 'string') {
                const parsed = Number(value);
                return Number.isNaN(parsed) ? NaN : parsed;
            }
            return NaN;
        })
        .typeError(`${fieldLabel} must be a valid number`)
        .integer(`${fieldLabel} must be a whole number`)
        .min(1, `${fieldLabel} must be at least 1`);

const schema = yup.object({
    sqft: numberField('Square footage').required('Square footage is required'),
    bedrooms: numberField('Bedrooms').required('Bedrooms is required'),
});

export type PredictionFormValues = yup.InferType<typeof schema>;

type PredictionProps = {
    loading: boolean;
    result?: PredictionResponse | null;
    error?: string | null;
    onBack: () => void;
    onSubmit: (values: PredictionFormValues) => void | Promise<void>;
    initialValues?: Partial<PredictionFormValues>;
};

const EMPTY_DEFAULTS: PredictionFormValues = { sqft: 0, bedrooms: 0 };

function Prediction({ loading, result, error, onBack, onSubmit, initialValues }: PredictionProps) {
    const defaultValues = useMemo(() => ({ ...EMPTY_DEFAULTS, ...initialValues }), [initialValues]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<PredictionFormValues>({
        resolver: yupResolver(schema, { abortEarly: false }),
        mode: 'onBlur',
        defaultValues,
        shouldFocusError: true,
    });

    const isBusy = loading || isSubmitting;

    return (
        <div className="w-full max-w-md animate-fadeIn">
            <button type="button" onClick={onBack} className="mb-6 text-sm text-slate-500 hover:text-slate-700 transition">
                ← Back
            </button>

            <h2 className="text-3xl font-semibold text-slate-800 mb-8 text-center">Estimate Your Property</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
                <fieldset disabled={isBusy} className="contents">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="sqft-input">
                            Square Footage (ft²)
                        </label>
                        <input
                            id="sqft"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            placeholder="e.g. 1500"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:outline-none text-slate-800"
                            {...register('sqft')}
                            aria-invalid={!!errors.sqft || undefined}
                            aria-describedby={errors.sqft ? 'sqft-error' : undefined}
                        />
                        {errors.sqft && (
                            <p id="sqft-error" className="mt-2 text-sm text-red-600">
                                {errors.sqft.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="beds-input">
                            Number of Bedrooms
                        </label>
                        <input
                            id="bedrooms"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            placeholder="e.g. 3"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-300 focus:outline-none text-slate-800"
                            {...register('bedrooms')}
                            aria-invalid={!!errors.bedrooms || undefined}
                            aria-describedby={errors.bedrooms ? 'bedrooms-error' : undefined}
                        />
                        {errors.bedrooms && (
                            <p id="bedrooms-error" className="mt-2 text-sm text-red-600">
                                {errors.bedrooms.message}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="mt-4 py-4 w-full rounded-xl text-lg font-semibold bg-gradient-to-r from-indigo-600 to-sky-500 text-white shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-3 disabled:opacity-70"
                    >
                        {isBusy ? 'Predicting...' : 'Estimate Price'}
                    </button>
                </fieldset>
            </form>

            {result && <Result result={result} />}
            {error && <Error error={error} />}
        </div>
    );
}

export default React.memo(Prediction);
