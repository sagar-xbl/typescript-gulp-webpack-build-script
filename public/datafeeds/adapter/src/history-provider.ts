import {
	Bar,
	HistoryMetadata,
	LibrarySymbolInfo,
} from '../../../charting_library/datafeed-api';

import {
	getErrorMessage,
	RequestParams,
	ErrorResponse,
	OkResponse,
	Response,
} from './helpers';

import { Requester } from './requester';

// interface HistoryPartialDataResponse extends OkResponse {
// 	t: number[];
// 	c: number[];
// 	o?: never;
// 	h?: never;
// 	l?: never;
// 	v?: never;
// }

interface HistoryData extends OkResponse {
	_id: string;
	date: number;
	close: number;
	open: number;
	high: number;
	low: number;
	volume: number;
	volumeCurrency: number;
	weightedPrice: number;
}

interface HistoryFullDataResponse extends OkResponse {
	data: HistoryData[];
}

interface HistoryNoDataResponse extends Response {
	status: 'no_data';
	nextTime?: number;
}

type HistoryResponse = HistoryFullDataResponse | HistoryNoDataResponse;

export interface GetBarsResult {
	bars: Bar[];
	meta: HistoryMetadata;
}

export class HistoryProvider {
	private _datafeedUrl: string;
	private readonly _requester: Requester;

	public constructor(datafeedUrl: string, requester: Requester) {
		this._datafeedUrl = datafeedUrl;
		this._requester = requester;
	}

	public getBars(symbolInfo: LibrarySymbolInfo, resolution: string, rangeStartDate: number, rangeEndDate: number): Promise<GetBarsResult> {
		const requestParams: RequestParams = {
			symbol: symbolInfo.ticker || '',
			resolution: resolution,
			from: rangeStartDate,
			to: rangeEndDate,
		};

		return new Promise((resolve: (result: GetBarsResult) => void, reject: (reason: string) => void) => {
			this._requester.sendRequest<HistoryResponse>(this._datafeedUrl, 'history', requestParams)
				.then((response: HistoryResponse | ErrorResponse) => {
					if (response.status !== 'success' && response.status !== 'no_data') {
						reject(response.error);
						return;
					}

					const bars: Bar[] = [];
					const meta: HistoryMetadata = {
						noData: false,
					};

					if (response.status === 'no_data') {
						meta.noData = true;
						meta.nextTime = response.nextTime;
					} else {
						for (let i = 0; i < response.data.length; ++i) {
							const data = response.data[i];

							const barValue: Bar = {
								time: data.date * 1000,
								close: data.close,
								open: data.open,
								high: data.high,
								low: data.low,
								volume: data.volume
							};

							bars.push(barValue);
						}
					}

					resolve({
						bars: bars,
						meta: meta,
					});
				})
				.catch((reason?: string | Error) => {
					const reasonString = getErrorMessage(reason);
					console.warn(`HistoryProvider: getBars() failed, error=${reasonString}`);
					reject(reasonString);
				});
		});
	}
}